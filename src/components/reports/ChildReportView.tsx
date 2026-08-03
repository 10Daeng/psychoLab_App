"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Brain, FileText, Lightbulb, RefreshCw, Sparkles, Star, ClipboardCheck } from "lucide-react";
import ObservationForm from "@/app/admin/reports/[id]/ObservationForm";
import { IQGauge } from "./SharedReportComponents";
import ClinicalWorkspace from "./ClinicalWorkspace";
import { evaluateConflicts } from "@/lib/services/conflictEngine";

const config = { label: "Anak", color: "orange", accent: "bg-orange-500", light: "bg-orange-50", text: "text-orange-700", icon: "🪔" };

export default function ChildReportView({ report, testResults }: { report: any, testResults: any[] }) {
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
  const parentQResult = testResults.find((r: any) => r.tests?.code === "PARENT_Q");
  const wviResult = testResults.find((r: any) => r.tests?.code === "WVI");

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
      const detectedFlags = evaluateConflicts('CHILD', {
        cognitive: { cpmScore: cogScore.rawScore || cogScore.totalRawScore },
        observation: {
          showsSeparationAnxiety: initialObs?.observation_data?.separationAnxiety === true,
          emotionalRegulation: initialObs?.observation_data?.tantrum ? 'POOR' : 'FAIR'
        },
        parentForm: {
          claimsIndependent: parentQResult?.calculated_score?.independent === true
        }
      });

      const payload = {
        clientName: client.name,
        context: 'CHILD',
        rawPayload: {
          cognitive: { cpmScore: cogScore.rawScore || cogScore.totalRawScore },
          observation: {
            showsSeparationAnxiety: initialObs?.observation_data?.separationAnxiety === true,
            emotionalRegulation: initialObs?.observation_data?.tantrum ? 'POOR' : 'FAIR'
          },
          parentForm: {
            claimsIndependent: parentQResult?.calculated_score?.independent === true
          }
        },
        conflictFlags: detectedFlags
      };

      const res = await fetch("/api/generate-narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal generate narasi");

      setAiNarrative(data.htmlContent);

      if (cogResult?.id) {
        await supabase
          .from("test_results")
          .update({ calculated_score: { ...cogScore, ai_narrative: data.htmlContent } })
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
  const wviScore = wviResult?.calculated_score?.calculatedData || {};

  return (
    <div className="space-y-8 pb-20">
      
      {/* 1. Profil Klien Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Nama Lengkap</p>
            <p className="text-base font-bold text-white">{client?.name || "-"}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Orang Tua / Wali</p>
            <p className="text-base font-bold text-white">{client?.parent_name || "-"}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Usia</p>
            <p className="text-base font-bold text-white">{client?.birth_date ? `${new Date().getFullYear() - new Date(client.birth_date).getFullYear()} tahun` : "-"}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Tanggal Asesmen</p>
            <p className="text-base font-bold text-white">{report?.created_at ? new Date(report.created_at).toLocaleDateString("id-ID", { dateStyle: "long" }) : "-"}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Asal Sekolah</p>
            <p className="text-base font-bold text-white">{client?.school_or_institution || "-"}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Kelas</p>
            <p className="text-base font-bold text-white">{client?.grade || "-"}</p>
          </div>
        </div>
      </div>

      {/* 2. Kognitif (CPM/RAVEN2) */}
      {cogResult && iqValue > 0 && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-orange-400" /> Profil Kognitif ({cogResult.tests?.code})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center mb-6">
            <div className="col-span-1 flex justify-center">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 w-full max-w-[200px] flex justify-center">
                 <div className="scale-75 md:scale-90 origin-center"><IQGauge iq={iqValue} /></div>
              </div>
            </div>
            <div className="col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Skor Mentah", value: cogScore.rawScore ?? cogScore.totalRawScore ?? "-", color: "text-blue-400" },
                { label: "Persentil", value: cogScore.percentile || "-", color: "text-emerald-400" },
                { label: "IQ Estimasi", value: iqValue || "-", color: "text-orange-400" },
                { label: "Klasifikasi", value: cogScore.level?.level || cogScore.classification || "-", color: "text-amber-400" },
              ].map((item) => (
                <div key={item.label} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-center items-center text-center">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">{item.label}</p>
                  <p className={`text-xl md:text-2xl font-black ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
          {cogScore.setScores && (
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 border-t border-slate-800 pt-4">Skor per Bagian ({cogResult.tests?.code})</p>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {Object.entries(cogScore.setScores).map(([set, score]) => (
                  <div key={set} className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Set {set}</p>
                    <p className="text-2xl font-black text-slate-300">{score as number} <span className="text-xs text-slate-600 font-normal">/ 12</span></p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. WVI (If Available for older children) */}
      {wviResult && Object.keys(wviScore).length > 0 && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" /> Profil Nilai Kerja (WVI)
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-emerald-950/20 border border-emerald-900/50 p-5 rounded-xl">
               <h3 className="text-emerald-400 font-bold mb-4 uppercase tracking-wider text-sm border-b border-emerald-900/50 pb-2">3 Nilai Paling Diutamakan</h3>
               <div className="space-y-4">
                 {(wviScore.top3 || []).map((v: any, i: number) => {
                   const pct = Math.round((v.score / 5) * 100);
                   return (
                     <div key={i}>
                       <div className="flex justify-between text-sm mb-1">
                         <span className="text-slate-300">{v.name}</span>
                         <span className="text-emerald-400 font-bold">{v.score}</span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                         <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%`}}></div>
                       </div>
                     </div>
                   );
                 })}
               </div>
            </div>

            <div className="bg-rose-950/20 border border-rose-900/50 p-5 rounded-xl">
               <h3 className="text-rose-400 font-bold mb-4 uppercase tracking-wider text-sm border-b border-rose-900/50 pb-2">3 Nilai Paling Dihindari</h3>
               <div className="space-y-4">
                 {(wviScore.bottom3 || []).map((v: any, i: number) => {
                   const pct = Math.round((v.score / 5) * 100);
                   return (
                     <div key={i}>
                       <div className="flex justify-between text-sm mb-1">
                         <span className="text-slate-300">{v.name}</span>
                         <span className="text-rose-400 font-bold">{v.score}</span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                         <div className="h-full bg-rose-500 rounded-full" style={{ width: `${pct}%`}}></div>
                       </div>
                     </div>
                   );
                 })}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Kuesioner Orang Tua */}
      {parentQScore && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-teal-400" /> Hasil Kuesioner Orang Tua
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: '1. Riwayat Kehamilan & Kelahiran', key: 'kehamilan' },
              { title: '2. Motorik Kasar & Halus', key: 'motorikKasar' },
              { title: '3. Perkembangan Bahasa', key: 'bahasa' },
              { title: '4. Sosial & Pertemanan', key: 'sosial' },
              { title: '5. Kematangan Emosi', key: 'emosi' },
              { title: '6. Catatan Tambahan', key: 'catatan' }
            ].map(item => (
              <div key={item.key} className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-sm">
                <h4 className="font-bold text-sm text-teal-400 mb-2 uppercase tracking-wider">{item.title}</h4>
                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {parentQScore[item.key] || <span className="italic text-slate-600">Tidak diisi</span>}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. AI Interpretasi */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" /> Interpretasi Otomatis (Sistem)
          </h2>
          <button onClick={handleGenerateAI} disabled={aiGenerating} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2">
             <RefreshCw className={`w-4 h-4 ${aiGenerating ? "animate-spin" : ""}`} /> 
             {aiNarrative ? "Hasilkan Ulang Interpretasi" : "Generate Interpretasi"}
          </button>
        </div>
        
        <div className="p-6">
          {aiNarrative ? (
            <div className="space-y-6">
              <ClinicalWorkspace 
                reportType="CHILD"
                clientName={client?.name}
                aiDraft={aiNarrative} 
                conflictFlags={evaluateConflicts('CHILD', {
                  cognitive: { cpmScore: cogScore.rawScore || cogScore.totalRawScore },
                  observation: {
                    showsSeparationAnxiety: initialObs?.observation_data?.separationAnxiety === true,
                    emotionalRegulation: initialObs?.observation_data?.tantrum ? 'POOR' : 'FAIR'
                  },
                  parentForm: {
                    claimsIndependent: parentQResult?.calculated_score?.independent === true
                  }
                })}
                onSave={async (finalHtml) => {
                  try {
                    const { data: existing } = await supabase
                      .from("client_reports")
                      .select("id")
                      .eq("report_id", report.id)
                      .single();

                    if (existing) {
                      await supabase
                        .from("client_reports")
                        .update({
                          final_synthesis_html: finalHtml,
                          ai_generated_draft: aiNarrative,
                          status: 'FINALIZED',
                          finalized_at: new Date().toISOString()
                        })
                        .eq("id", existing.id);
                    } else {
                      await supabase
                        .from("client_reports")
                        .insert({
                          client_id: client.id,
                          report_id: report.id,
                          ai_generated_draft: aiNarrative,
                          final_synthesis_html: finalHtml,
                          included_modules: ['CPM', 'PARENT_Q', 'OBSERVATION'],
                          status: 'FINALIZED',
                          finalized_at: new Date().toISOString()
                        });
                    }
                    alert("Draf Interpretasi berhasil disimpan secara permanen!");
                  } catch (e: any) {
                    alert("Gagal menyimpan: " + e.message);
                  }
                }}
                onPrint={() => alert("Fitur cetak PDF akan segera hadir!")}
              />
            </div>
          ) : (
            <div className="py-16 text-center">
               <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-slate-600" />
               </div>
               <p className="text-slate-400 mb-2">Interpretasi Belum Tersedia</p>
               <p className="text-sm text-slate-500">Sistem AI belum menghasilkan interpretasi untuk laporan ini. Silakan klik tombol Generate.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* 6. Observasi & Catatan Psikolog (Bottom) */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
         <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" /> Observasi & Catatan Psikolog
         </h2>
         <div className="text-slate-300">
            {/* Note: ObservationForm has its own styling, it might need to adapt to dark theme or be embedded smoothly */}
            <ObservationForm initialData={notes} onSave={handleSaveNotes} />
         </div>
      </div>

    </div>
  );
}
