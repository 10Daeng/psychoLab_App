"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Target } from "lucide-react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

const WARTEGG_BOXES = [
  { id: 1, name: "Box 1 (Ego/Identity)", defaultSDR: "ORGANIC" },
  { id: 2, name: "Box 2 (Social/Flexibility)", defaultSDR: "ORGANIC" },
  { id: 3, name: "Box 3 (Ambition/Goals)", defaultSDR: "INORGANIC" },
  { id: 4, name: "Box 4 (Burden/Anxiety)", defaultSDR: "INORGANIC" },
  { id: 5, name: "Box 5 (Energy/Action)", defaultSDR: "INORGANIC" },
  { id: 6, name: "Box 6 (Integration/Rationality)", defaultSDR: "INORGANIC" },
  { id: 7, name: "Box 7 (Sensibility/Emotion)", defaultSDR: "ORGANIC" },
  { id: 8, name: "Box 8 (Protection/Social)", defaultSDR: "ORGANIC" },
];

export default function WarteggAssessorPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [report, setReport] = useState<any>(null);

  const [boxes, setBoxes] = useState<any[]>(
    WARTEGG_BOXES.map(b => ({
      id: b.id, order: b.id, sdr: b.defaultSDR, content: "ANIMATE", notes: ""
    }))
  );
  
  const [favorites, setFavorites] = useState({ liked: 1, disliked: 2, easiest: 3, hardest: 4 });
  const [existingTestId, setExistingTestId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: rData } = await supabase.from("reports").select("*, clients(*)").eq("id", reportId).single();
      setReport(rData);

      const { data: tData } = await supabase.from("tests").select("id").eq("code", "WARTEGG").single();
      if (!tData) return setLoading(false);
      
      const { data: results } = await supabase
        .from("test_results")
        .select("*")
        .eq("report_id", reportId)
        .eq("test_id", tData.id)
        .single();

      if (results && results.calculated_score) {
        setExistingTestId(results.id);
        const calc = results.calculated_score.calculatedData || {};
        if (calc.boxes) setBoxes(calc.boxes);
        if (calc.favorites) setFavorites(calc.favorites);
      }
      setLoading(false);
    }
    load();
  }, [reportId]);

  const updateBox = (id: number, key: string, value: any) => {
    setBoxes(prev => prev.map(b => b.id === id ? { ...b, [key]: value } : b));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: tData } = await supabase.from("tests").select("id").eq("code", "WARTEGG").single();
      if (!tData) throw new Error("Wartegg test not found in master tests.");
      
      const payload = { boxes, favorites };
      
      // Simple trait analysis for Wartegg
      const traits = [];
      const firstDrawn = boxes.find(b => b.order === 1)?.id;
      if (firstDrawn === 1) traits.push("Pusat pada Diri (Ego Sentris)");
      if (firstDrawn === 3) traits.push("Berorientasi pada Prestasi/Tujuan");
      if (firstDrawn === 5) traits.push("Dinamis/Bertindak cepat");
      
      // Conflict checking: Inappropriate SDR
      const inappropriateSDRs = boxes.filter(b => {
        const expected = WARTEGG_BOXES.find(wb => wb.id === b.id)?.defaultSDR;
        return expected !== b.sdr;
      });
      if (inappropriateSDRs.length > 2) traits.push("Resistensi terhadap stimulasi / Inkonvensional");

      const calculated_score = {
        calculatedData: payload,
        traits_identified: traits,
        conflict_flags: [] 
      };

      if (existingTestId) {
        await supabase.from("test_results").update({ calculated_score }).eq("id", existingTestId);
      } else {
        await supabase.from("test_results").insert({
          report_id: reportId,
          test_id: tData.id,
          raw_answers: payload,
          calculated_score
        });
      }
      toast.success("Data Wartegg berhasil disimpan!");
      setTimeout(() => router.back(), 1000);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">Memuat data...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 pb-20">
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white transition-all text-sm font-semibold">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
          <div className="font-bold text-teal-400 flex items-center gap-2">
            <Target className="w-4 h-4" /> Input Wartegg Asesor
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6 mt-6">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
           <h2 className="text-xl font-bold text-white mb-2">{report?.clients?.name || "Klien"}</h2>
           <p className="text-sm text-slate-500 mb-8">Masukkan hasil interpretasi 8 kotak Wartegg (WZT) ke dalam matriks di bawah ini.</p>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
             {boxes.map((box, idx) => (
               <div key={box.id} className="bg-slate-950 border border-slate-800 p-5 rounded-xl">
                 <h3 className="font-bold text-slate-400 mb-4">{WARTEGG_BOXES[idx].name}</h3>
                 <div className="grid grid-cols-2 gap-4 mb-4">
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Urutan Gambar</label>
                     <input type="number" min="1" max="8" value={box.order} onChange={(e) => updateBox(box.id, "order", parseInt(e.target.value))} className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">SDR (Stimulus)</label>
                     <select value={box.sdr} onChange={(e) => updateBox(box.id, "sdr", e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none">
                       <option value="ORGANIC">Organik (Benda Hidup/Melengkung)</option>
                       <option value="INORGANIC">Inorganik (Benda Mati/Kaku)</option>
                     </select>
                   </div>
                 </div>
                 <div className="mb-4">
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Konten / Kategori</label>
                   <select value={box.content} onChange={(e) => updateBox(box.id, "content", e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none">
                     <option value="ANIMATE">Animate (Manusia/Hewan)</option>
                     <option value="INANIMATE">Inanimate (Benda Buatan/Bangunan)</option>
                     <option value="ATMOSPHERE">Atmosphere (Alam/Pemandangan)</option>
                     <option value="ABSTRACTION">Abstraction (Pola/Simbol)</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nama Gambar / Judul</label>
                   <input type="text" value={box.notes} onChange={(e) => updateBox(box.id, "notes", e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none" placeholder="Misal: Bunga matahari..." />
                 </div>
               </div>
             ))}
           </div>

           <div className="bg-slate-950 border border-slate-800 p-6 rounded-xl mb-8">
             <h3 className="font-bold text-slate-300 mb-4">Pilihan Klien (Preferensi)</h3>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Paling Disukai (+)</label>
                 <input type="number" min="1" max="8" value={favorites.liked} onChange={(e) => setFavorites({...favorites, liked: parseInt(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 text-center" />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Paling Tidak Disukai (-)</label>
                 <input type="number" min="1" max="8" value={favorites.disliked} onChange={(e) => setFavorites({...favorites, disliked: parseInt(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 text-center" />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Paling Mudah (M)</label>
                 <input type="number" min="1" max="8" value={favorites.easiest} onChange={(e) => setFavorites({...favorites, easiest: parseInt(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 text-center" />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Paling Sulit (S)</label>
                 <input type="number" min="1" max="8" value={favorites.hardest} onChange={(e) => setFavorites({...favorites, hardest: parseInt(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 text-center" />
               </div>
             </div>
           </div>
           
           <div className="flex justify-end">
              <button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 shadow-lg shadow-teal-500/20 transition-all">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {saving ? "Memproses..." : "Simpan & Proses Wartegg"}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
