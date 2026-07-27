"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Brain, FileText, Lightbulb, RefreshCw, AlertTriangle, Sparkles } from "lucide-react";
import ObservationForm from "@/app/admin/reports/[id]/ObservationForm";
import { IQGauge, TraitBar } from "./SharedReportComponents";

const config = { label: "Anak", color: "orange", accent: "bg-orange-500", light: "bg-orange-50", text: "text-orange-700", icon: "🪔" };

export default function ChildReportView({ report, testResults }: { report: any, testResults: any[] }) {
  const [activeTab, setActiveTab] = useState<"profile" | "cognitive" | "parentq" | "ai" | "notes">("profile");
  
  const initialObs = report?.observations?.[0] || report?.observations; // handles array or object depending on select statement
  const initialNotesString = initialObs 
    ? JSON.stringify({ notes: initialObs.notes || "", observation: initialObs.observation_data || {}, interview: initialObs.interview_data || {} }) 
    : (report?.psychologist_notes || "");
  const [notes, setNotes] = useState(initialNotesString);
  const [aiNarrative, setAiNarrative] = useState<any>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState("");

  const client = report?.clients as any;
  const cogResult = testResults.find((r: any) => ["CPM", "RAVEN2"].includes(r.tests?.code));
  const parentQResult = testResults.find((r: any) => r.tests?.code === "PARENT_Q");

  useEffect(() => {
    if (cogResult?.calculated_score?.ai_narrative) {
      setAiNarrative(cogResult.calculated_score.ai_narrative);
    }
  }, [cogResult]);

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
        segment: "CHI",
        name: client.name,
        nickname: client.name?.split(" ")[0] || client.name,
        ageYears,
        iq: cogScore.iq || cogScore.calculatedData?.iq,
        percentile: cogScore.percentile,
        totalScore: cogScore.rawScore,
        firstAttemptScore: cogScore.attempt1_correct,
        psychogram: cogScore.psychogram,
        parentQ: parentQResult?.calculated_score?.calculatedData?.history || null,
      };

      const res = await fetch("/api/generate-narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal generate narasi");

      const narrative = {
        interpretation: data.interpretation,
        conclusion: data.conclusion,
        recommendation: data.recommendation,
        specialNote: data.specialNote,
        generated_at: new Date().toISOString(),
      };
      setAiNarrative(narrative);

      if (cogResult?.id) {
        await supabase
          .from("test_results")
          .update({ calculated_score: { ...cogScore, ai_narrative: narrative } })
          .eq("id", cogResult.id);
      }
    } catch (err: any) {
      setAiError(err.message);
    } finally {
      setAiGenerating(false);
    }
  };

  const cogScore = cogResult?.calculated_score || {};
  const iqValue = cogScore.iq || cogScore.calculatedData?.iq || 0;
  const parentQScore = parentQResult?.calculated_score?.calculatedData?.history || null;

  const tabs = [
    { id: "profile", label: "Profil Klien", icon: Users },
    { id: "cognitive", label: "Analisis Kognitif", icon: Brain },
    ...(parentQScore ? [{ id: "parentq", label: "Kuesioner Ortu", icon: FileText }] : []),
    { id: "ai", label: "Dinamika AI", icon: Lightbulb },
    { id: "notes", label: "Observasi & Catatan", icon: FileText },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Sidebar Nav */}
      <div className="w-full md:w-56 shrink-0">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2 sticky top-20">
          <p className="text-[10px] font-bold text-slate-400 px-3 pt-2 pb-1 uppercase tracking-wider">Laporan Anak</p>
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

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                Laporan {config.label}
              </h1>
              <p className="text-slate-500 mt-1 text-lg">{client?.name || "Peserta"}</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "profile" && (
              <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="border border-slate-200 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
                    <span className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center text-sm">👤</span>
                    Informasi Peserta
                  </h2>
                  <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm">
                    {[
                      ["Nama Lengkap", client?.name],
                      ["Tanggal Lahir", client?.birth_date ? new Date(client.birth_date).toLocaleDateString("id-ID", { dateStyle: "long" }) : "-"],
                      ["Jenis Kelamin", client?.gender === "L" ? "Laki-laki" : client?.gender === "P" ? "Perempuan" : "-"],
                      ["Asal Sekolah / Instansi", client?.school_or_institution || "-"],
                      ["Kelas", client?.grade || "-"],
                      ["Orang Tua / Wali", client?.parent_name || "-"],
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
                              { label: "Skor Mentah", value: cogScore.rawScore ?? cogScore.totalRawScore ?? "-", unit: "/ 36", color: "blue" },
                              { label: "Persentil", value: cogScore.percentile || "-", unit: "", color: "emerald" },
                              { label: "IQ Estimasi", value: iqValue || "-", unit: "", color: "violet" },
                              { label: "Profil Kecepatan", value: cogScore.calculatedData?.speed_accuracy_profile || cogScore.speed_accuracy_profile || "-", unit: "", color: "amber" },
                            ].map((item) => (
                              <div key={item.label} className={`bg-${item.color}-50 border border-${item.color}-100 rounded-xl p-4`}>
                                <p className="text-xs font-bold text-slate-500 uppercase mb-1">{item.label}</p>
                                <p className={`text-2xl font-black text-${item.color}-700`}>{item.value} <span className="text-sm font-normal text-slate-500">{item.unit}</span></p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {cogScore.setScores && (
                        <div>
                          <p className="text-sm font-bold text-slate-600 mb-3">Skor per Bagian (CPM)</p>
                          <div className="grid grid-cols-3 gap-3">
                            {Object.entries(cogScore.setScores).map(([set, score]) => (
                              <div key={set} className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                                <p className="text-xs text-slate-500 font-bold mb-1">Bagian {set}</p>
                                <p className="text-3xl font-black text-slate-800">{score as number}</p>
                                <p className="text-xs text-slate-400">/ 12</p>
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

            {activeTab === "parentq" && parentQScore && (
              <motion.div key="parentq" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                    <FileText className="w-6 h-6 text-teal-600" /> Hasil Kuesioner Orang Tua
                  </h2>
                  <div className="space-y-6">
                    {[
                      { title: '1. Riwayat Kehamilan & Kelahiran', key: 'kehamilan' },
                      { title: '2. Motorik Kasar & Halus', key: 'motorikKasar' },
                      { title: '3. Perkembangan Bahasa', key: 'bahasa' },
                      { title: '4. Sosial & Pertemanan', key: 'sosial' },
                      { title: '5. Kematangan Emosi', key: 'emosi' },
                      { title: '6. Catatan Tambahan', key: 'catatan' }
                    ].map(item => (
                      <div key={item.key} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <h4 className="font-bold text-sm text-slate-700 mb-2">{item.title}</h4>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{parentQScore[item.key] || <span className="italic text-slate-400">Tidak diisi</span>}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "ai" && (
              <motion.div key="ai" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="space-y-6">
                  {aiNarrative ? (
                    <div className="bg-gradient-to-br from-orange-50 via-white to-teal-50 border border-orange-100 rounded-2xl p-6">
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
                      {aiNarrative.interpretation && (
                        <div className="mb-5">
                          <h4 className="text-sm font-bold text-slate-700 mb-2">1. Dinamika Kepribadian & Belajar</h4>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{aiNarrative.interpretation}</p>
                        </div>
                      )}
                      {aiNarrative.conclusion && (
                        <div className="mb-5">
                          <h4 className="text-sm font-bold text-slate-700 mb-2">2. Kesimpulan</h4>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{aiNarrative.conclusion}</p>
                        </div>
                      )}
                      {aiNarrative.recommendation && (
                        <div className="mb-5">
                          <h4 className="text-sm font-bold text-slate-700 mb-2">3. Rekomendasi</h4>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{aiNarrative.recommendation}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-300 rounded-2xl p-12 text-center">
                      <Sparkles className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                      <h3 className="text-xl font-bold text-slate-600 mb-2">Narasi AI Belum Dibuat</h3>
                      <button onClick={handleGenerateAI} disabled={aiGenerating} className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-8 py-3 rounded-2xl font-bold">
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
