"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Brain, Target, Lightbulb, FileText, RefreshCw, Sparkles, TrendingUp, BarChart2 } from "lucide-react";
import ObservationForm from "@/app/admin/reports/[id]/ObservationForm";
import { IQGauge, TraitBar } from "./SharedReportComponents";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";

const config = { label: "Siswa", color: "teal", accent: "bg-teal-500", light: "bg-teal-50", text: "text-teal-700", icon: "📚" };

export default function StudentReportView({ report, testResults }: { report: any, testResults: any[] }) {
  const [activeTab, setActiveTab] = useState<"profile" | "cognitive" | "personality" | "ai" | "notes">("profile");
  
  const initialObs = report?.observations?.[0] || report?.observations;
  const initialNotesString = initialObs 
    ? JSON.stringify({ notes: initialObs.notes || "", observation: initialObs.observation_data || {}, interview: initialObs.interview_data || {} }) 
    : (report?.psychologist_notes || "");
  const [notes, setNotes] = useState(initialNotesString);
  const [aiNarrative, setAiNarrative] = useState<any>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState("");

  const client = report?.clients as any;
  const cogResult = testResults.find((r: any) => ["CPM", "RAVEN2"].includes(r.tests?.code));
  const vakResult = testResults.find((r: any) => r.tests?.code === "VAK");
  const riasecResult = testResults.find((r: any) => ["SDS", "RIASEC"].includes(r.tests?.code));

  useEffect(() => {
    const aiSrc = cogResult?.calculated_score?.ai_narrative || riasecResult?.calculated_score?.ai_narrative;
    if (aiSrc) setAiNarrative(aiSrc);
  }, [cogResult, riasecResult]);

  const handleSaveNotes = async (dataToSave: string) => {
    try {
      const res = await fetch(`/api/admin/reports/${report.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: dataToSave }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
    } catch (err: any) {
      alert("Gagal menyimpan catatan: " + err.message);
    }
  };

  const handleGenerateAI = async () => {
    if (!client) {
      alert("Data klien belum tersedia.");
      return;
    }
    setAiGenerating(true);
    setAiError("");

    try {
      const birth = client?.birth_date ? new Date(client.birth_date) : null;
      const ageYears = birth ? new Date().getFullYear() - birth.getFullYear() : 0;
      const cogScore = cogResult?.calculated_score || {};

      const payload = {
        segment: "STU",
        name: client.name,
        nickname: client.name?.split(" ")[0] || client.name,
        ageYears,
        iq: cogScore.iq || cogScore.calculatedData?.iq,
        percentile: cogScore.percentile,
        totalScore: cogScore.rawScore || cogScore.totalRawScore,
        vak: vakResult?.calculated_score?.calculatedData,
        riasec: riasecResult?.calculated_score?.calculatedData,
      };

      const res = await fetch("/api/generate-narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal generate narasi");

      const narrative = {
        stuData: data.stuData,
        generated_at: new Date().toISOString(),
      };
      setAiNarrative(narrative);

      const targetToUpdate = cogResult || riasecResult;
      if (targetToUpdate?.id) {
        await supabase
          .from("test_results")
          .update({ calculated_score: { ...targetToUpdate.calculated_score, ai_narrative: narrative } })
          .eq("id", targetToUpdate.id);
      }
    } catch (err: any) {
      setAiError(err.message);
    } finally {
      setAiGenerating(false);
    }
  };

  const cogScore = cogResult?.calculated_score || {};
  const iqValue = cogScore.iq || cogScore.calculatedData?.iq || 0;
  
  const riasecScore = riasecResult?.calculated_score?.calculatedData || {};
  const riasecBars = riasecScore ? Object.entries(riasecScore)
    .filter(([k]) => ["R", "I", "A", "S", "E", "C"].includes(k))
    .map(([k, v]) => ({
      key: k,
      label: { R: "Realistic", I: "Investigative", A: "Artistic", S: "Social", E: "Enterprising", C: "Conventional" }[k] || k,
      value: v as number,
      color: { R: "#6366f1", I: "#0ea5e9", A: "#f43f5e", S: "#22c55e", E: "#f59e0b", C: "#a855f7" }[k] || "#64748b",
    })) : [];

  const vakScore = vakResult?.calculated_score?.calculatedData || {};

  const tabs = [
    { id: "profile", label: "Profil Klien", icon: Users },
    { id: "cognitive", label: "Analisis Kognitif", icon: Brain },
    { id: "personality", label: "Minat & Bakat", icon: Target },
    { id: "ai", label: "Dinamika AI", icon: Lightbulb },
    { id: "notes", label: "Observasi & Catatan", icon: FileText },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-56 shrink-0">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2 sticky top-20">
          <p className="text-[10px] font-bold text-slate-400 px-3 pt-2 pb-1 uppercase tracking-wider">Laporan Siswa</p>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-2.5 px-3 py-3 text-left rounded-xl transition-all mb-0.5 text-sm ${
                  isActive ? `${config.light} ${config.text} font-semibold` : "hover:bg-slate-50 text-slate-600"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? config.text : "text-slate-400"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Laporan {config.label}</h1>
              <p className="text-slate-500 mt-1 text-lg">{client?.name || "Peserta"}</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "profile" && (
              <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="border border-slate-200 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
                    <span className="w-7 h-7 bg-teal-100 rounded-lg flex items-center justify-center text-sm">👤</span>
                    Informasi Peserta
                  </h2>
                  <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm">
                    {[
                      ["Nama Lengkap", client?.name],
                      ["Tanggal Lahir", client?.birth_date ? new Date(client.birth_date).toLocaleDateString("id-ID", { dateStyle: "long" }) : "-"],
                      ["Jenis Kelamin", client?.gender === "L" ? "Laki-laki" : client?.gender === "P" ? "Perempuan" : "-"],
                      ["Asal Sekolah", client?.school_or_institution || "-"],
                      ["Kelas", client?.grade || "-"],
                      ["Nomor Induk / NISN", client?.registration_number || "-"],
                      ["Tgl Tes", report?.created_at ? new Date(report.created_at).toLocaleDateString("id-ID", { dateStyle: "long" }) : "-"],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <span className="text-slate-500">{label}</span>
                        <p className="font-semibold text-slate-800 mt-0.5">{value || "-"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "cognitive" && (
              <motion.div key="cognitive" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {cogResult ? (
                  <div className="space-y-6">
                    <div className="border border-slate-200 rounded-2xl p-6">
                      <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <Brain className="w-5 h-5 text-blue-500" /> Profil Kognitif ({cogResult.tests?.code})
                      </h2>
                      {iqValue > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                          <div className="flex justify-center"><IQGauge iq={iqValue} /></div>
                          <div className="md:col-span-2 grid grid-cols-2 gap-4">
                            {[
                              { label: "Skor Mentah", value: cogScore.rawScore ?? cogScore.totalRawScore ?? "-", unit: "/ 60", color: "blue" },
                              { label: "Persentil", value: cogScore.percentile || "-", unit: "", color: "emerald" },
                              { label: "IQ Estimasi", value: iqValue || "-", unit: "", color: "violet" },
                              { label: "Klasifikasi", value: cogScore.level?.level || cogScore.classification || "-", unit: "", color: "amber" },
                            ].map((item) => (
                              <div key={item.label} className={`bg-${item.color}-50 border border-${item.color}-100 rounded-xl p-4`}>
                                <p className="text-xs font-bold text-slate-500 uppercase mb-1">{item.label}</p>
                                <p className={`text-2xl font-black text-${item.color}-700`}>{item.value} <span className="text-sm font-normal text-slate-500">{item.unit}</span></p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 text-slate-400">
                    <Brain className="w-20 h-20 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">Data kognitif belum tersedia.</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "personality" && (
              <motion.div key="personality" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="space-y-6">
                  {riasecResult && riasecBars.length > 0 && (
                    <div className="border border-slate-200 rounded-2xl p-6">
                      <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-teal-500" /> Profil Minat Karir (RIASEC)
                      </h2>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={riasecBars} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / .1)" }} />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={50}>
                            {riasecBars.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      {riasecScore.top_code && (
                        <div className="mt-4 bg-teal-50 border border-teal-200 rounded-xl p-3 text-sm">
                          <span className="text-slate-600">Kode RIASEC dominan: </span>
                          <span className="font-bold text-teal-800">{riasecScore.top_code}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {vakResult && (
                    <div className="border border-slate-200 rounded-2xl p-6">
                      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-emerald-500" /> Gaya Belajar (VAK)
                      </h2>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { key: "V", label: "Visual", color: "blue" },
                          { key: "A", label: "Auditory", color: "purple" },
                          { key: "K", label: "Kinesthetic", color: "emerald" },
                        ].map(({ key, label, color }) => {
                          const val = vakScore?.[key] || 0;
                          const isDominant = vakScore?.dominant === label || val === Math.max(vakScore?.V || 0, vakScore?.A || 0, vakScore?.K || 0);
                          return (
                            <div key={key} className={`rounded-xl p-4 text-center border-2 ${isDominant ? `border-${color}-500 bg-${color}-50` : "border-slate-200 bg-slate-50"}`}>
                              <p className={`text-3xl font-black ${isDominant ? `text-${color}-700` : "text-slate-600"}`}>{val}</p>
                              <p className={`text-sm font-bold mt-1 ${isDominant ? `text-${color}-600` : "text-slate-500"}`}>{label}</p>
                              {isDominant && <span className={`text-[10px] font-bold bg-${color}-100 text-${color}-700 px-1.5 py-0.5 rounded-full mt-1 inline-block`}>Dominan</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "ai" && (
              <motion.div key="ai" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="space-y-6">
                  {aiNarrative ? (
                    <div className="bg-gradient-to-br from-teal-50 via-white to-blue-50 border border-teal-100 rounded-2xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">💡</div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-800">Narasi AI Lentera Batin</h3>
                          </div>
                        </div>
                        <button onClick={handleGenerateAI} disabled={aiGenerating} className="text-xs text-blue-600 flex items-center gap-1 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-lg">
                          <RefreshCw className={`w-3 h-3 ${aiGenerating ? "animate-spin" : ""}`} /> Regenerate
                        </button>
                      </div>
                      {aiNarrative.stuData?.interpretasiTerpadu && (
                        <div className="mb-8">
                          <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-teal-100 pb-2">
                            <Target className="w-4 h-4 text-teal-600" /> A. Interpretasi Terpadu
                          </h4>
                          <ul className="list-disc pl-5 space-y-2 mb-4">
                            {aiNarrative.stuData.interpretasiTerpadu.poinAnalisis?.map((poin: string, idx: number) => (
                              <li key={idx} className="text-sm text-slate-700 leading-relaxed">{poin}</li>
                            ))}
                          </ul>
                          <div className="bg-teal-50 border-l-4 border-teal-500 p-4 rounded-r-xl italic text-slate-700 text-sm">
                            "{aiNarrative.stuData.interpretasiTerpadu.paragrafKesimpulan}"
                          </div>
                        </div>
                      )}
                      
                      {aiNarrative.stuData?.saranPengembangan && (
                        <div className="mb-8">
                          <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-blue-100 pb-2">
                            <Lightbulb className="w-4 h-4 text-blue-600" /> B. Saran Pengembangan Praktis
                          </h4>
                          
                          {aiNarrative.stuData.saranPengembangan.lingkunganRumah && (
                            <div className="mb-4">
                              <h5 className="font-bold text-slate-700 text-xs uppercase mb-3">1. Lingkungan Rumah & Keluarga</h5>
                              <div className="grid gap-3">
                                {aiNarrative.stuData.saranPengembangan.lingkunganRumah.map((item: any, idx: number) => (
                                  <div key={idx} className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                                    <p className="font-bold text-blue-800 text-sm mb-1">{item.potensi}</p>
                                    <p className="text-sm text-slate-600 mb-1"><strong className="text-slate-700">Kegiatan:</strong> {item.kegiatan}</p>
                                    <p className="text-sm text-slate-600"><strong className="text-slate-700">Manfaat:</strong> {item.manfaat}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {aiNarrative.stuData.saranPengembangan.kolaborasiSekolah && (
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <h5 className="font-bold text-slate-700 text-xs uppercase mb-3">2. Kolaborasi Sekolah</h5>
                                <ul className="list-disc pl-4 space-y-1">
                                  {aiNarrative.stuData.saranPengembangan.kolaborasiSekolah.map((saran: string, idx: number) => (
                                    <li key={idx} className="text-sm text-slate-700">{saran}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {aiNarrative.stuData.saranPengembangan.pengembanganKarakter && (
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <h5 className="font-bold text-slate-700 text-xs uppercase mb-3">3. Pengembangan Karakter</h5>
                                <ul className="list-disc pl-4 space-y-1">
                                  {aiNarrative.stuData.saranPengembangan.pengembanganKarakter.map((saran: string, idx: number) => (
                                    <li key={idx} className="text-sm text-slate-700">{saran}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {aiNarrative.stuData?.petaMasaDepan && (
                        <div className="mb-4">
                          <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-emerald-100 pb-2">
                            <TrendingUp className="w-4 h-4 text-emerald-600" /> C. Peta Masa Depan (Rekomendasi Karir)
                          </h4>
                          
                          {aiNarrative.stuData.petaMasaDepan.rekomendasiKarir && (
                            <div className="grid gap-3 mb-6">
                              {aiNarrative.stuData.petaMasaDepan.rekomendasiKarir.map((item: any, idx: number) => (
                                <div key={idx} className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm border-l-4 border-l-emerald-500">
                                  <div className="flex justify-between items-start mb-2">
                                    <p className="font-bold text-emerald-900 text-sm">{item.bidang}</p>
                                    <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded">Opsi {idx + 1}</span>
                                  </div>
                                  <p className="text-sm text-slate-700 font-medium mb-1">{item.contohKarir}</p>
                                  <p className="text-xs text-slate-500 leading-relaxed">{item.alasanKesesuaian}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {aiNarrative.stuData.petaMasaDepan.pesanUntukOrangTua && (
                            <div className="bg-gradient-to-r from-teal-500 to-emerald-600 p-5 rounded-2xl text-white shadow-lg">
                              <h5 className="font-bold text-teal-100 text-xs uppercase mb-2">Pesan Untuk Orang Tua</h5>
                              <p className="text-sm font-medium leading-relaxed italic">
                                "{aiNarrative.stuData.petaMasaDepan.pesanUntukOrangTua}"
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-300 rounded-2xl p-12 text-center">
                      <Sparkles className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                      <h3 className="text-xl font-bold text-slate-600 mb-2">Narasi AI Belum Dibuat</h3>
                      <button onClick={handleGenerateAI} disabled={aiGenerating} className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-8 py-3 rounded-2xl font-bold">
                        {aiGenerating ? "AI sedang menulis..." : "Generate Narasi AI"}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "notes" && (
              <motion.div key="notes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <ObservationForm initialData={notes} onSave={handleSaveNotes} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
