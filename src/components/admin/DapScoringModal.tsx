"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, CheckSquare, Square, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

const DAP_ITEMS = [
  { id: 1, category: "Kepala", text: "Kepala digambar" },
  { id: 2, category: "Leher", text: "Leher digambar" },
  { id: 3, category: "Leher", text: "Leher digambar dalam 2 dimensi" },
  { id: 4, category: "Mata", text: "Mata digambar" },
  { id: 5, category: "Mata", text: "Detail mata: alis atau bulu mata digambar" },
  { id: 6, category: "Mata", text: "Detail mata: pupil (titik hitam) digambar" },
  { id: 7, category: "Mata", text: "Proporsi mata tepat (tidak terlalu besar/kecil)" },
  { id: 8, category: "Mata", text: "Arah pandangan mata terlihat jelas" },
  { id: 9, category: "Hidung", text: "Hidung digambar" },
  { id: 10, category: "Hidung", text: "Hidung digambar dalam 2 dimensi (bukan sekadar titik/garis)" },
  { id: 11, category: "Mulut", text: "Mulut digambar" },
  { id: 12, category: "Mulut", text: "Bibir digambar dalam 2 dimensi" },
  { id: 13, category: "Wajah", text: "Hidung dan Bibir tergambar proporsional (2 dimensi)" },
  { id: 14, category: "Wajah", text: "Dagu dan dahi digambar jelas" },
  { id: 15, category: "Wajah", text: "Dagu terlihat menonjol / berbeda dari leher" },
  { id: 16, category: "Wajah", text: "Garis rahang terlihat jelas" },
  { id: 17, category: "Wajah", text: "Batang hidung tergambar" },
  { id: 18, category: "Rambut", text: "Rambut digambar (bentuk apapun)" },
  { id: 19, category: "Rambut", text: "Rambut digambar rapi, tidak tembus pandang menutupi kepala" },
  { id: 20, category: "Rambut", text: "Rambut digambar dengan detail tekstur / model" },
  { id: 21, category: "Rambut", text: "Ada belahan rambut yang jelas" },
  { id: 22, category: "Telinga", text: "Telinga digambar" },
  { id: 23, category: "Telinga", text: "Proporsi dan posisi telinga tepat" },
  { id: 24, category: "Tangan", text: "Jari-jari tangan digambar" },
  { id: 25, category: "Tangan", text: "Jumlah jari benar (5 jari per tangan)" },
  { id: 26, category: "Tangan", text: "Detail jari benar (panjang lebih dari lebar, 2 dimensi)" },
  { id: 27, category: "Tangan", text: "Jempol tangan digambar berbeda dari jari lain" },
  { id: 28, category: "Tangan", text: "Bentuk telapak tangan digambar dengan jelas" },
  { id: 29, category: "Sendi", text: "Pergelangan tangan atau kaki digambar" },
  { id: 30, category: "Lengan", text: "Lengan digambar" },
  { id: 31, category: "Bahu", text: "Bahu digambar (tidak langsung menyambung dari leher/kepala)" },
  { id: 32, category: "Lengan", text: "Lengan digambar di sisi tubuh atau sedang melakukan aktivitas" },
  { id: 33, category: "Lengan", text: "Lengan terhubung ke batang tubuh" },
  { id: 34, category: "Lengan", text: "Lengan terhubung di titik yang tepat (di area bahu)" },
  { id: 35, category: "Tubuh", text: "Batang tubuh (badan) digambar" },
  { id: 36, category: "Tubuh", text: "Proporsi batang tubuh memanjang (panjang > lebar)" },
  { id: 37, category: "Kaki", text: "Kaki digambar" },
  { id: 38, category: "Kaki", text: "Kaki terhubung ke batang tubuh" },
  { id: 39, category: "Kaki", text: "Kaki terhubung di titik yang tepat (bagian bawah tubuh)" },
  { id: 40, category: "Kaki", text: "Proporsi kaki tepat (tidak terlalu panjang/pendek dibanding tubuh)" },
  { id: 41, category: "Kaki", text: "Telapak kaki atau sepatu digambar" },
  { id: 42, category: "Kaki", text: "Proporsi telapak kaki tepat" },
  { id: 43, category: "Kaki", text: "Tumit digambar" },
  { id: 44, category: "Motorik", text: "Garis-garis gambar tegas dan terhubung dengan baik (koordinasi motorik)" },
  { id: 45, category: "Motorik", text: "Sambungan antar tubuh (sendi) tergambar tanpa tumpang tindih berlebih" },
  { id: 46, category: "Motorik", text: "Bentuk outline kepala baik tanpa distorsi parah" },
  { id: 47, category: "Motorik", text: "Bentuk outline batang tubuh baik" },
  { id: 48, category: "Motorik", text: "Bentuk lengan dan kaki proporsional secara keseluruhan" },
  { id: 49, category: "Motorik", text: "Garis bentuk wajah terkontrol dengan baik" },
  { id: 50, category: "Pakaian", text: "Pakaian digambar (ada indikasi baju/celana)" },
  { id: 51, category: "Pakaian", text: "Minimal ada 2 jenis pakaian yang digambar (misal baju & celana/rok)" },
  { id: 52, category: "Pakaian", text: "Gambar tidak transparan (tubuh tidak terlihat tembus pakaian)" },
  { id: 53, category: "Pakaian", text: "Terdapat 4 atau lebih aksesori pakaian (kancing, kerah, sabuk, topi, sepatu, dll)" },
  { id: 54, category: "Pakaian", text: "Pakaian lengkap atau ada kostum khusus yang jelas temanya" },
  { id: 55, category: "Profil", text: "Kepala, tubuh, dan kaki digambar dari sudut pandang profil (menyamping) - Level 1" },
  { id: 56, category: "Profil", text: "Gambar profil konsisten tanpa bagian transparan - Level 2" },
  { id: 57, category: "Tubuh", text: "Proporsi area kepala terhadap tubuh adalah 1/10 hingga 1/4" },
  { id: 58, category: "Tubuh", text: "Proporsi area kepala terhadap tubuh adalah 1/12 hingga 1/5" },
  { id: 59, category: "Lengan", text: "Panjang lengan sebanding dengan panjang batang tubuh" },
  { id: 60, category: "Kaki", text: "Panjang kaki sama atau sedikit lebih panjang dari tubuh" },
  { id: 61, category: "Kaki", text: "Lebar kedua kaki seimbang dengan ukuran tubuh" },
  { id: 62, category: "Lengan", text: "Kedua lengan digambar dengan ketebalan yang pas (2 dimensi tipis)" },
  { id: 63, category: "Wajah", text: "Jarak mata proporsional dengan lebar wajah" },
  { id: 64, category: "Wajah", text: "Posisi hidung di tengah wajah proporsional terhadap mata dan mulut" },
  { id: 65, category: "Wajah", text: "Posisi mulut proporsional di bawah hidung" },
  { id: 66, category: "Motorik", text: "Tekanan pensil stabil, tidak ada coretan berlebih (shading)" },
  { id: 67, category: "Motorik", text: "Kualitas garis halus, bebas patahan" },
  { id: 68, category: "Lengan", text: "Terdapat sendi siku yang digambar melengkung/menyiku" },
  { id: 69, category: "Kaki", text: "Terdapat sendi lutut yang digambar melengkung/menyiku" },
  { id: 70, category: "Pakaian", text: "Lengan baju digambar dengan detail lipatan/kerutan" },
  { id: 71, category: "Pakaian", text: "Sepatu digambar dengan detail tali atau hak" },
  { id: 72, category: "Pakaian", text: "Celana/rok menutupi tubuh bawah dengan lipatan logis" },
  { id: 73, category: "Proporsi", text: "Titik pusat gravitasi gambar (keseimbangan) terlihat natural berdiri tegak" }
];

interface DapScoringModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenId: string;
  clientId: string;
  clientName: string;
  onSuccess?: () => void;
}

export default function DapScoringModal({ isOpen, onClose, tokenId, clientId, clientName, onSuccess }: DapScoringModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [activeTab, setActiveTab] = useState("Kepala");

  useEffect(() => {
    if (!isOpen) return;
    
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/dap/${tokenId}`);
        const data = await res.json();

        if (res.ok && data.dapData) {
          setCheckedItems(data.dapData.checklist_data || {});
          setClinicalNotes(data.dapData.clinical_notes || "");
        } else {
          // Reset jika belum ada data
          setCheckedItems({});
          setClinicalNotes("");
        }
      } catch (err: any) {
        toast.error("Gagal mengambil data DAP: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [isOpen, tokenId]);

  const toggleItem = (id: number) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getScore = () => Object.values(checkedItems).filter(v => v).length;

  const getMaturityLevel = (score: number) => {
    if (score < 25) return "Rendah / Kurang Matang";
    if (score <= 50) return "Rata-rata / Cukup";
    return "Tinggi / Sangat Matang";
  };

  const handleSave = async () => {
    setSaving(true);
    const score = getScore();
    const maturity = getMaturityLevel(score);

    try {
      const payload = {
        client_id: clientId,
        token_id: tokenId,
        score,
        cognitive_maturity_level: maturity,
        checklist_data: checkedItems,
        clinical_notes: clinicalNotes
      };

      const res = await fetch(`/api/admin/dap/${tokenId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menyimpan data");

      toast.success("Skoring DAP berhasil disimpan!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error("Gagal menyimpan data: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const groupedItems = DAP_ITEMS.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof DAP_ITEMS>);

  const tabs = Object.keys(groupedItems);
  const currentScore = getScore();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900/50">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                Penilaian Grafis (DAP)
              </h2>
              <p className="text-slate-400 text-sm mt-1">Klien: <span className="font-semibold text-blue-400">{clientName}</span></p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition p-2 rounded-xl hover:bg-white/5">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
            {loading ? (
              <div className="flex-1 flex items-center justify-center p-12">
                <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                {/* Kiri: Checklist */}
                <div className="flex-1 flex flex-col border-r border-slate-800 bg-slate-900/30 overflow-hidden">
                  {/* Tabs */}
                  <div className="flex overflow-x-auto p-4 gap-2 border-b border-slate-800 scrollbar-hide">
                    {tabs.map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 border border-transparent'}`}
                      >
                        {tab}
                        <span className="ml-2 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                          {groupedItems[tab].filter(i => checkedItems[i.id]).length}/{groupedItems[tab].length}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Checklist Items */}
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {groupedItems[activeTab]?.map(item => {
                        const isChecked = !!checkedItems[item.id];
                        return (
                          <div 
                            key={item.id}
                            onClick={() => toggleItem(item.id)}
                            className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all border ${isChecked ? 'bg-blue-500/10 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'}`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {isChecked ? <CheckSquare className="w-5 h-5 text-blue-400" /> : <Square className="w-5 h-5 text-slate-600" />}
                            </div>
                            <span className={`text-sm leading-relaxed ${isChecked ? 'text-blue-100 font-medium' : 'text-slate-400'}`}>
                              {item.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Kanan: Catatan & Skor */}
                <div className="w-full lg:w-[320px] shrink-0 p-6 flex flex-col bg-slate-900/50">
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 mb-6 text-center">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total Skor</div>
                    <div className="text-4xl font-black text-emerald-400">{currentScore} <span className="text-lg text-slate-600">/ 73</span></div>
                    <div className="mt-4 pt-4 border-t border-slate-800">
                       <span className="text-xs text-slate-400 block mb-1">Estimasi Kematangan:</span>
                       <span className="text-sm font-bold text-blue-400">{getMaturityLevel(currentScore)}</span>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col min-h-[200px]">
                    <label className="text-sm font-bold text-white mb-2 block">Catatan Klinis</label>
                    <textarea
                      value={clinicalNotes}
                      onChange={(e) => setClinicalNotes(e.target.value)}
                      className="flex-1 w-full bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none text-sm placeholder:text-slate-600"
                      placeholder="Observasi kualitatif gaya gambar, ukuran, tekanan..."
                    ></textarea>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900/80">
            <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition">Tutup</button>
            <button 
              onClick={handleSave} 
              disabled={loading || saving} 
              className="px-6 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] transition disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save className="w-4 h-4"/>} 
              Simpan Penilaian
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
