"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Brain, Target, Lightbulb, FileText, RefreshCw, Sparkles, Star } from "lucide-react";
import ObservationForm from "@/app/admin/reports/[id]/ObservationForm";
import { IQGauge, TraitBar } from "./SharedReportComponents";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";

const config = { label: "Karyawan", color: "violet", accent: "bg-violet-600", light: "bg-violet-50", text: "text-violet-700", icon: "💼" };

export default function EmployeeReportView({ report, testResults }: { report: any, testResults: any[] }) {
  const [activeTab, setActiveTab] = useState<"profile" | "cognitive" | "personality" | "ai" | "notes">("profile");
  const [notes, setNotes] = useState(report?.psychologist_notes || "");
  const [aiNarrative, setAiNarrative] = useState<any>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState("");

  const client = report?.clients as any;
  const cogResult = testResults.find((r: any) => ["CPM", "RAVEN2"].includes(r.tests?.code));
  const discResult = testResults.find((r: any) => r.tests?.code === "DISC");
  const hexacoResult = testResults.find((r: any) => r.tests?.code === "HEXACO");
  const wviResult = testResults.find((r: any) => r.tests?.code === "WVI");

  useEffect(() => {
    const aiSrc = cogResult?.calculated_score?.ai_narrative || discResult?.calculated_score?.ai_narrative;
    if (aiSrc) setAiNarrative(aiSrc);
  }, [cogResult, discResult]);

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
        segment: "EMP",
        name: client.name,
        nickname: client.name?.split(" ")[0] || client.name,
        ageYears,
        iq: cogScore.iq || cogScore.calculatedData?.iq,
        percentile: cogScore.percentile,
        totalScore: cogScore.rawScore || cogScore.totalRawScore,
        disc: discResult?.calculated_score?.calculatedData,
        hexaco: hexacoResult?.calculated_score?.calculatedData,
        wvi: wviResult?.calculated_score?.calculatedData,
        position: client.grade || "Posisi Umum",
      };

      const res = await fetch("/api/generate-narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal generate narasi");

      const narrative = {
        empData: data.empData,
        generated_at: new Date().toISOString(),
      };
      setAiNarrative(narrative);

      const targetToUpdate = cogResult || discResult;
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
  
  const discScore = discResult?.calculated_score?.calculatedData || {};
  const discRadarData = discScore.primary_trait ? [
    { trait: "Dominance (D)", value: discScore.D || 24 },
    { trait: "Influence (I)", value: discScore.I || 24 },
    { trait: "Steadiness (S)", value: discScore.S || 24 },
    { trait: "Compliance (C)", value: discScore.C || 24 },
  ] : [];

  const hexacoScore = hexacoResult?.calculated_score?.calculatedData || {};
  const hexacoBars = hexacoScore.H !== undefined ? [
    { key: "H", label: "Kejujuran", value: hexacoScore.H || 0, color: "#10b981" },
    { key: "E", label: "Emosionalitas", value: hexacoScore.E || 0, color: "#f59e0b" },
    { key: "X", label: "Ekstraversi", value: hexacoScore.X || 0, color: "#3b82f6" },
    { key: "A", label: "Kooperatif", value: hexacoScore.A || 0, color: "#8b5cf6" },
    { key: "C", label: "Tanggung Jawab", value: hexacoScore.C || 0, color: "#06b6d4" },
    { key: "O", label: "Keterbukaan", value: hexacoScore.O || 0, color: "#f43f5e" },
  ] : [];

  const wviScore = wviResult?.calculated_score?.calculatedData || {};

  const tabs = [
    { id: "profile", label: "Profil Klien", icon: Users },
    { id: "cognitive", label: "Analisis Kognitif", icon: Brain },
    { id: "personality", label: "Profil Kepribadian", icon: Target },
    { id: "ai", label: "Dinamika AI", icon: Lightbulb },
    { id: "notes", label: "Observasi & Catatan", icon: FileText },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-56 shrink-0">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2 sticky top-20">
          <p className="text-[10px] font-bold text-slate-400 px-3 pt-2 pb-1 uppercase tracking-wider">Laporan Karyawan</p>
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
                    <span className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center text-sm">👤</span>
                    Informasi Peserta
                  </h2>
                  <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm">
                    {[
                      ["Nama Lengkap", client?.name],
                      ["Tanggal Lahir", client?.birth_date ? new Date(client.birth_date).toLocaleDateString("id-ID", { dateStyle: "long" }) : "-"],
                      ["Jenis Kelamin", client?.gender === "L" ? "Laki-laki" : client?.gender === "P" ? "Perempuan" : "-"],
                      ["Instansi", client?.school_or_institution || "-"],
                      ["Jabatan / Posisi", client?.grade || "-"],
                      ["Nomor Karyawan / NIK", client?.registration_number || "-"],
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
                  {discResult && discRadarData.length > 0 && (
                    <div className="border border-slate-200 rounded-2xl p-6">
                      <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-500" /> Profil Perilaku DISC
                      </h2>
                      <p className="text-sm text-slate-500 mb-5">
                        Arketipe: <span className="font-bold text-slate-800">{discScore.archetype || "-"}</span>
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ResponsiveContainer width="100%" height={250}>
                          <RadarChart data={discRadarData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="trait" tick={{ fontSize: 11 }} />
                            <PolarRadiusAxis domain={[0, 48]} tick={{ fontSize: 9 }} />
                            <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                          </RadarChart>
                        </ResponsiveContainer>
                        <div className="space-y-3 flex flex-col justify-center">
                          {[
                            { label: "Dominance (D)", val: discScore.D || 24, color: "#ef4444" },
                            { label: "Influence (I)", val: discScore.I || 24, color: "#f59e0b" },
                            { label: "Steadiness (S)", val: discScore.S || 24, color: "#22c55e" },
                            { label: "Compliance (C)", val: discScore.C || 24, color: "#3b82f6" },
                          ].map(({ label, val, color }) => (
                            <TraitBar key={label} label={label} value={val} max={48} color={color} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {hexacoResult && hexacoBars.length > 0 && (
                    <div className="border border-slate-200 rounded-2xl p-6">
                      <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
                        <Star className="w-5 h-5 text-purple-500" /> Profil Kepribadian HEXACO
                        {hexacoScore.validation_warning && (
                          <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full ml-1">⚠ Tidak Valid</span>
                        )}
                      </h2>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={hexacoBars} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(v: any) => v?.toFixed?.(2) || v} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / .1)" }} />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={50}>
                            {hexacoBars.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      {hexacoScore.validation_warning && (
                        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                          ⚠ {hexacoScore.validation_warning}
                        </div>
                      )}
                    </div>
                  )}

                  {wviResult && Object.keys(wviScore).length > 0 && (
                    <div className="border border-slate-200 rounded-2xl p-6">
                      <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-500" /> Nilai Kerja (WVI)
                      </h2>
                      <div className="space-y-3">
                        {Object.entries(wviScore)
                          .filter(([k]) => typeof wviScore[k] === "number")
                          .sort(([, a], [, b]) => (b as number) - (a as number))
                          .slice(0, 8)
                          .map(([key, val]) => (
                            <TraitBar key={key} label={key.replace(/_/g, " ")} value={val as number} max={5} color="#f59e0b" />
                          ))}
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
                    <div className="bg-gradient-to-br from-violet-50 via-white to-indigo-50 border border-violet-100 rounded-2xl p-6">
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
                      {aiNarrative.empData?.deskripsiTerintegrasi && (
                        <div className="mb-6">
                          <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2 border-b border-violet-100 pb-2">
                            1. Deskripsi Kepribadian Terintegrasi
                          </h4>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed text-justify">
                            {aiNarrative.empData.deskripsiTerintegrasi}
                          </p>
                        </div>
                      )}

                      {aiNarrative.empData?.kekuatanUtama && aiNarrative.empData.kekuatanUtama.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2 border-b border-emerald-100 pb-2">
                            2. Kekuatan Utama
                          </h4>
                          <ul className="list-disc pl-5 space-y-2">
                            {aiNarrative.empData.kekuatanUtama.map((item: string, idx: number) => (
                              <li key={idx} className="text-sm text-slate-700 leading-relaxed font-medium">{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {aiNarrative.empData?.tantanganHambatan && (
                        <div className="mb-6 bg-red-50/50 p-4 rounded-xl border border-red-100">
                          <h4 className="text-sm font-bold text-red-800 mb-3 flex items-center gap-2 border-b border-red-200 pb-2">
                            3. Tantangan & Hambatan
                          </h4>
                          
                          {aiNarrative.empData.tantanganHambatan.areaFriksi && (
                            <div className="mb-4">
                              <h5 className="font-bold text-red-700 text-xs uppercase mb-1">Area Friksi / Hambatan</h5>
                              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                {aiNarrative.empData.tantanganHambatan.areaFriksi}
                              </p>
                            </div>
                          )}

                          {aiNarrative.empData.tantanganHambatan.karakterInternal && (
                            <div>
                              <h5 className="font-bold text-red-700 text-xs uppercase mb-1">Karakter Internal</h5>
                              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                {aiNarrative.empData.tantanganHambatan.karakterInternal}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {aiNarrative.empData?.lingkunganIdeal && (
                        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                            <h4 className="text-sm font-bold text-blue-800 mb-2 border-b border-blue-200 pb-2">
                              Ekosistem Kerja Ideal
                            </h4>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                              {aiNarrative.empData.lingkunganIdeal.ekosistemKerja}
                            </p>
                          </div>
                          
                          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                            <h4 className="text-sm font-bold text-indigo-800 mb-2 border-b border-indigo-200 pb-2">
                              Kebutuhan Motivasi
                            </h4>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                              {aiNarrative.empData.lingkunganIdeal.kebutuhanMotivasi}
                            </p>
                          </div>
                        </div>
                      )}

                      {aiNarrative.empData?.saranPengembangan && aiNarrative.empData.saranPengembangan.length > 0 && (
                        <div className="mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                          <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
                            4. Saran Pengembangan Strategis
                          </h4>
                          <ul className="list-disc pl-5 space-y-2">
                            {aiNarrative.empData.saranPengembangan.map((saran: string, idx: number) => (
                              <li key={idx} className="text-sm text-slate-700 leading-relaxed">{saran}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {aiNarrative.empData?.rekomendasiAkhir && (
                        <div className="mb-4 border-2 border-emerald-500 bg-emerald-50 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-center">
                          <div className="shrink-0 flex flex-col items-center justify-center bg-white border border-emerald-200 rounded-full w-24 h-24 md:w-28 md:h-28 shadow-sm">
                            <span className="text-3xl md:text-4xl font-black text-emerald-600">{aiNarrative.empData.rekomendasiAkhir.persentaseJobFit}%</span>
                            <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase mt-1 tracking-wider text-center leading-tight">Job Fit</span>
                          </div>
                          <div className="flex-1 text-center md:text-left">
                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Rekomendasi Akhir</h4>
                            <p className="text-lg md:text-xl font-black text-slate-800 mb-2">
                              {aiNarrative.empData.rekomendasiAkhir.status}
                            </p>
                            <p className="text-sm text-slate-700 leading-relaxed italic">
                              "{aiNarrative.empData.rekomendasiAkhir.keterangan}"
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-300 rounded-2xl p-12 text-center">
                      <Sparkles className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                      <h3 className="text-xl font-bold text-slate-600 mb-2">Narasi AI Belum Dibuat</h3>
                      <button onClick={handleGenerateAI} disabled={aiGenerating} className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-500 to-indigo-500 text-white px-8 py-3 rounded-2xl font-bold">
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
