"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function GraphologyAssessorPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [report, setReport] = useState<any>(null);

  // Graphology indicators
  const [slant, setSlant] = useState("UPRIGHT");
  const [baseline, setBaseline] = useState("LEVEL");
  const [zone, setZone] = useState("MIDDLE");
  const [size, setSize] = useState("MEDIUM");
  const [spacing, setSpacing] = useState("NORMAL");
  const [pressure, setPressure] = useState("MODERATE");
  const [notes, setNotes] = useState("");

  const [existingTestId, setExistingTestId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      // Fetch report
      const { data: rData } = await supabase.from("reports").select("*, clients(*)").eq("id", reportId).single();
      setReport(rData);

      // Fetch GRAPHOLOGY test ID
      const { data: tData } = await supabase.from("tests").select("id").eq("code", "GRAPHOLOGY").single();
      if (!tData) return setLoading(false);
      const graphologyTestId = tData.id;

      // Check if already inputted
      const { data: results } = await supabase
        .from("test_results")
        .select("*")
        .eq("report_id", reportId)
        .eq("test_id", graphologyTestId)
        .single();

      if (results && results.calculated_score) {
        setExistingTestId(results.id);
        const calc = results.calculated_score.calculatedData || {};
        setSlant(calc.slant || "UPRIGHT");
        setBaseline(calc.baseline || "LEVEL");
        setZone(calc.zone || "MIDDLE");
        setSize(calc.size || "MEDIUM");
        setSpacing(calc.spacing || "NORMAL");
        setPressure(calc.pressure || "MODERATE");
        setNotes(calc.notes || "");
      }
      setLoading(false);
    }
    load();
  }, [reportId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: tData } = await supabase.from("tests").select("id").eq("code", "GRAPHOLOGY").single();
      if (!tData) throw new Error("Graphology test not found in master tests.");
      
      const payload = {
        slant, baseline, zone, size, spacing, pressure, notes
      };
      
      // Simple trait identification algorithm
      const traits = [];
      if (slant === "RIGHT" || slant === "EXTREME_RIGHT") traits.push("Expressive/Emotional");
      if (slant === "LEFT" || slant === "EXTREME_LEFT") traits.push("Reserved/Introverted");
      if (baseline === "ASCENDING") traits.push("Optimistic/Ambitious");
      if (baseline === "DESCENDING") traits.push("Fatigued/Pessimistic");
      if (zone === "UPPER") traits.push("Intellectual/Idealistic");
      if (zone === "LOWER") traits.push("Materialistic/Physical");
      if (size === "LARGE") traits.push("Outgoing/Confident");
      if (size === "SMALL") traits.push("Focused/Introspective");

      const calculated_score = {
        calculatedData: payload,
        traits_identified: traits,
        conflict_flags: [] // To be updated later if cross-validating
      };

      if (existingTestId) {
        await supabase.from("test_results").update({
          calculated_score
        }).eq("id", existingTestId);
      } else {
        await supabase.from("test_results").insert({
          report_id: reportId,
          test_id: tData.id,
          raw_answers: payload,
          calculated_score
        });
      }
      toast.success("Data Grafologi berhasil disimpan!");
      setTimeout(() => router.back(), 1000);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">Memuat data...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white transition-all text-sm font-semibold">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
          <div className="font-bold text-teal-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Input Grafologi Asesor
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
           <h2 className="text-xl font-bold text-white mb-2">{report?.clients?.name || "Klien"}</h2>
           <p className="text-sm text-slate-500 mb-6">Silakan amati sampel tulisan tangan / tanda tangan klien dan masukkan indikatornya ke dalam matriks di bawah ini. Algoritma akan melakukan validasi silang (Conflict Engine) dengan tes self-report.</p>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">1. Kemiringan (Slant)</label>
                 <select value={slant} onChange={(e) => setSlant(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg p-3 text-sm focus:border-teal-500 outline-none">
                    <option value="EXTREME_LEFT">A - Sangat Miring Kiri (Detached/Menarik Diri)</option>
                    <option value="LEFT">B - Miring Kiri (Reserved)</option>
                    <option value="UPRIGHT">C - Tegak Lurus (Objective/Logis)</option>
                    <option value="RIGHT">D - Miring Kanan (Expressive/Ramah)</option>
                    <option value="EXTREME_RIGHT">E - Sangat Miring Kanan (Impulsif Emosional)</option>
                 </select>
              </div>

              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">2. Baseline (Garis Dasar)</label>
                 <select value={baseline} onChange={(e) => setBaseline(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg p-3 text-sm focus:border-teal-500 outline-none">
                    <option value="ASCENDING">Menanjak (Optimis/Ambisius)</option>
                    <option value="LEVEL">Lurus (Stabil/Disiplin)</option>
                    <option value="DESCENDING">Menurun (Lelah/Pesimis)</option>
                    <option value="ERRATIC">Naik Turun / Bergelombang (Mood Swing)</option>
                 </select>
              </div>

              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">3. Zona Dominan</label>
                 <select value={zone} onChange={(e) => setZone(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg p-3 text-sm focus:border-teal-500 outline-none">
                    <option value="UPPER">Zona Atas Kuat (Intelektual/Imajinatif)</option>
                    <option value="MIDDLE">Zona Tengah Dominan (Sosial/Realistis)</option>
                    <option value="LOWER">Zona Bawah Kuat (Materialistis/Insting)</option>
                    <option value="BALANCED">Seimbang</option>
                 </select>
              </div>

              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">4. Ukuran Tulisan</label>
                 <select value={size} onChange={(e) => setSize(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg p-3 text-sm focus:border-teal-500 outline-none">
                    <option value="LARGE">Besar (Ekstrovert/Percaya Diri)</option>
                    <option value="MEDIUM">Sedang (Adaptif)</option>
                    <option value="SMALL">Kecil (Fokus/Introvert)</option>
                 </select>
              </div>

              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">5. Jarak Antar Kata</label>
                 <select value={spacing} onChange={(e) => setSpacing(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg p-3 text-sm focus:border-teal-500 outline-none">
                    <option value="TIGHT">Rapat (Butuh Kedekatan)</option>
                    <option value="NORMAL">Normal</option>
                    <option value="WIDE">Lebar (Butuh Ruang Personal/Jaga Jarak)</option>
                 </select>
              </div>

              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">6. Tekanan Tulisan (Pressure)</label>
                 <select value={pressure} onChange={(e) => setPressure(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg p-3 text-sm focus:border-teal-500 outline-none">
                    <option value="HEAVY">Tebal/Berat (Energi Tinggi/Agresif)</option>
                    <option value="MODERATE">Sedang</option>
                    <option value="LIGHT">Tipis/Ringan (Sensitif/Energi Rendah)</option>
                 </select>
              </div>
           </div>

           <div className="mt-6">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">7. Catatan Klinis Khusus</label>
              <textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                rows={4} 
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg p-3 text-sm focus:border-teal-500 outline-none"
                placeholder="Misal: Margin kiri semakin melebar (menjauh dari masa lalu), ada indikasi coretan tajam di T-bar..."
              />
           </div>
           
           <div className="mt-8 flex justify-end">
              <button 
                onClick={handleSave} 
                disabled={saving} 
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 shadow-lg shadow-teal-500/20 transition-all"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {saving ? "Memproses..." : "Simpan & Proses Analisis"}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
