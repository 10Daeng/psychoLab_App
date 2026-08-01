"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Save, ArrowLeft, CheckSquare, Square, CheckCircle2, UserCircle2 } from "lucide-react";
import Link from "next/link";
import toast, { Toaster } from 'react-hot-toast';

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

export default function DapScoringPage({ params }: { params: Promise<{ token_id: string }> }) {
  const router = useRouter();
  
  // Unwrap params
  const { token_id } = React.use(params);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [clinicalNotes, setClinicalNotes] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/admin/dap/${token_id}`);
        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Token tidak ditemukan");
          router.push("/admin/dap");
          return;
        }

        setClientData(data.tokenData);

        if (data.dapData) {
          setCheckedItems(data.dapData.checklist_data || {});
          setClinicalNotes(data.dapData.clinical_notes || "");
        }
      } catch (err: any) {
        toast.error("Gagal mengambil data: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [token_id, router]);

  const toggleItem = (id: number) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getScore = () => {
    return Object.values(checkedItems).filter(v => v).length;
  };

  const getMaturityLevel = (score: number) => {
    // Estimasi sangat kasar: 0-25 Kurang, 26-50 Rata-rata, 51-73 Tinggi
    // Pada aslinya harus dikonversi dengan mental age
    if (score < 25) return "Rendah / Kurang Matang";
    if (score <= 50) return "Rata-rata / Cukup";
    return "Tinggi / Sangat Matang";
  };

  const handleSave = async () => {
    if (!clientData?.client_id) return;
    setSaving(true);
    const score = getScore();
    const maturity = getMaturityLevel(score);

    try {
      const payload = {
        client_id: clientData.client_id,
        token_id: token_id,
        score,
        cognitive_maturity_level: maturity,
        checklist_data: checkedItems,
        clinical_notes: clinicalNotes
      };

      const res = await fetch(`/api/admin/dap/${token_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menyimpan data");

      toast.success("Skoring DAP berhasil disimpan!");
      setTimeout(() => {
        router.push("/admin/dap");
      }, 1500);

    } catch (err: any) {
      console.error(err);
      toast.error("Gagal menyimpan data: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
  );

  // Mengelompokkan item berdasarkan kategori untuk UI
  const groupedItems = DAP_ITEMS.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof DAP_ITEMS>);

  const currentScore = getScore();

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-8 pb-32">
      <Toaster position="top-center" />
      <div className="max-w-5xl mx-auto">
        <Link href="/admin/dap" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Direktori</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
              <UserCircle2 className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">{clientData?.clients?.name}</h1>
              <p className="text-slate-400 font-mono text-sm mt-1">{clientData?.token_code}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Skor Saat Ini</div>
            <div className="text-4xl font-black text-emerald-400">{currentScore} <span className="text-lg text-slate-500">/ 73</span></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-2">Checklist Goodenough-Harris</h2>
              <p className="text-slate-400 text-sm mb-6">Silakan amati kertas gambar anak, lalu beri centang pada indikator yang ada secara jelas pada gambar.</p>
              
              <div className="space-y-8">
                {Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {items.map(item => {
                        const isChecked = !!checkedItems[item.id];
                        return (
                          <div 
                            key={item.id}
                            onClick={() => toggleItem(item.id)}
                            className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border ${isChecked ? 'bg-blue-500/10 border-blue-500/30' : 'bg-slate-950/50 border-slate-800/50 hover:border-slate-700'}`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {isChecked ? <CheckSquare className="w-5 h-5 text-blue-400" /> : <Square className="w-5 h-5 text-slate-600" />}
                            </div>
                            <span className={`text-sm ${isChecked ? 'text-blue-100 font-medium' : 'text-slate-400'}`}>
                              {item.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sticky top-6">
              <h3 className="text-lg font-bold text-white mb-4">Catatan Klinis Tester</h3>
              <p className="text-xs text-slate-400 mb-4">Tuliskan observasi kualitatif terkait gaya belajar, tekanan emosional, ukuran gambar, posisi di kertas, atau keraguan saat anak menggambar.</p>
              <textarea
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-700 min-h-[200px]"
                placeholder="Contoh: Garis gambar tipis dan terputus-putus, mengindikasikan kecemasan. Gambar diposisikan sangat kecil di sudut kiri atas kertas..."
              ></textarea>

              <div className="mt-6 pt-6 border-t border-slate-800">
                <div className="flex items-center justify-between mb-4">
                   <span className="text-sm font-medium text-slate-400">Estimasi Kematangan</span>
                   <span className="text-sm font-bold text-emerald-400">{getMaturityLevel(currentScore)}</span>
                </div>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Save className="w-5 h-5" /> Simpan Hasil Skoring
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
