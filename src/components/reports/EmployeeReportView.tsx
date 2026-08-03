"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Brain, Target, Lightbulb, FileText, RefreshCw, Sparkles, Star, Download } from "lucide-react";
import ObservationForm from "@/app/admin/reports/[id]/ObservationForm";
import { IQGauge } from "./SharedReportComponents";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import ClinicalWorkspace from "./ClinicalWorkspace";
import { evaluateConflicts } from "@/lib/services/conflictEngine";

const config = { label: "Karyawan", color: "violet", accent: "bg-violet-600", light: "bg-violet-50", text: "text-violet-700", icon: "💼" };

export default function EmployeeReportView({ report, testResults }: { report: any, testResults: any[] }) {
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
  const discResult = testResults.find((r: any) => r.tests?.code === "DISC");
  const hexacoResult = testResults.find((r: any) => r.tests?.code === "HEXACO");
  const wviResult = testResults.find((r: any) => r.tests?.code === "WVI");
  const graphologyResult = testResults.find((r: any) => r.tests?.code === "GRAPHOLOGY");
  const warteggResult = testResults.find((r: any) => r.tests?.code === "WARTEGG");

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
      const detectedFlags = evaluateConflicts('EMPLOYEE', {
        hexaco: hexacoResult?.calculated_score?.calculatedData,
        disc: discResult?.calculated_score?.calculatedData,
        projective: graphologyResult?.calculated_score?.calculatedData || warteggResult?.calculated_score?.calculatedData,
        wvi: wviResult?.calculated_score?.calculatedData
      });

      const payload = {
        clientName: client.name,
        context: 'EMPLOYEE',
        rawPayload: {
          hexaco: hexacoResult?.calculated_score?.calculatedData,
          disc: discResult?.calculated_score?.calculatedData,
          projective: graphologyResult?.calculated_score?.calculatedData || warteggResult?.calculated_score?.calculatedData,
          wvi: wviResult?.calculated_score?.calculatedData
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

      const targetToUpdate = cogResult || discResult;
      if (targetToUpdate?.id) {
        await supabase
          .from("test_results")
          .update({ calculated_score: { ...targetToUpdate.calculated_score, ai_narrative: data.htmlContent } })
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
    { key: "H", label: "Honesty-Humility", value: hexacoScore.H || 0, color: "#8b5cf6" },
    { key: "E", label: "Emotionality", value: hexacoScore.E || 0, color: "#ef4444" },
    { key: "X", label: "eXtraversion", value: hexacoScore.X || 0, color: "#3b82f6" },
    { key: "A", label: "Agreeableness", value: hexacoScore.A || 0, color: "#10b981" },
    { key: "C", label: "Conscientiousness", value: hexacoScore.C || 0, color: "#f97316" },
    { key: "O", label: "Openness", value: hexacoScore.O || 0, color: "#14b8a6" },
  ] : [];

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
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Email / NIK</p>
            <p className="text-base font-bold text-white">{client?.email || client?.registration_number || "-"}</p>
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
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Asal Instansi</p>
            <p className="text-base font-bold text-white">{client?.school_or_institution || "-"}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Pekerjaan / Jabatan</p>
            <p className="text-base font-bold text-white">{client?.grade || "-"}</p>
          </div>
        </div>
      </div>

      {/* 2. Kognitif (RAVEN/CPM) */}
      {cogResult && iqValue > 0 && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-violet-400" /> Kapasitas Kognitif ({cogResult.tests?.code})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            <div className="col-span-1 flex justify-center">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 w-full max-w-[200px] flex justify-center">
                 {/* Re-using IQGauge but in dark mode wrapper if possible */}
                 <div className="scale-75 md:scale-90 origin-center"><IQGauge iq={iqValue} /></div>
              </div>
            </div>
            <div className="col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Skor Mentah", value: cogScore.rawScore ?? cogScore.totalRawScore ?? "-", color: "text-blue-400" },
                { label: "Persentil", value: cogScore.percentile || "-", color: "text-emerald-400" },
                { label: "IQ Estimasi", value: iqValue || "-", color: "text-violet-400" },
                { label: "Klasifikasi", value: cogScore.level?.level || cogScore.classification || "-", color: "text-amber-400" },
              ].map((item) => (
                <div key={item.label} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-center items-center text-center">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">{item.label}</p>
                  <p className={`text-xl md:text-2xl font-black ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bakat Diferensial (DAT) */}
      {testResults.find(r => r.tests?.code === "DAT") && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-teal-400" /> Tes Bakat Diferensial (DAT)
            </h2>
          </div>
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                {Object.entries(testResults.find(r => r.tests?.code === "DAT")?.calculated_score?.calculatedData?.percentiles || {}).map(([key, val]: any) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-400">{key}</span>
                      <span className="text-teal-400">{val}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${val}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col justify-center items-center p-6 bg-slate-900 border border-slate-800 rounded-xl">
                 <p className="text-xs font-bold text-slate-500 uppercase mb-2">Rekomendasi Penjurusan / Bidang</p>
                 <p className="text-lg font-bold text-teal-400 text-center">
                   {testResults.find(r => r.tests?.code === "DAT")?.calculated_score?.calculatedData?.recommendation || "Generalis"}
                 </p>
                 <div className="flex gap-4 mt-4 text-xs font-bold text-slate-400">
                   <div className="text-center">IPA/Teknik<br/><span className="text-blue-400">{testResults.find(r => r.tests?.code === "DAT")?.calculated_score?.calculatedData?.ipaScore || 0}</span></div>
                   <div className="text-center">IPS/Bahasa<br/><span className="text-yellow-400">{testResults.find(r => r.tests?.code === "DAT")?.calculated_score?.calculatedData?.ipsScore || 0}</span></div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Profil Gaya Kerja (DISC) */}
      {discResult && discRadarData.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" /> Profil Gaya Kerja (DISC)
            </h2>
            <div className="bg-blue-500/20 border border-blue-500/30 text-blue-400 px-3 py-1.5 rounded-lg text-sm font-bold">
              Pola: {discScore.archetype || "-"}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
             {/* We only have 1 combined radar chart in current data, but to mimic Lentera Batin, we'll show it in center */}
             <div className="lg:col-start-2">
               <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={discRadarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="trait" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 48]} tick={false} axisLine={false} />
                    <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Skor Tabel DISC */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs uppercase bg-slate-950 text-slate-500 border-y border-slate-800">
                <tr>
                  <th className="px-4 py-3">Dimensi</th>
                  <th className="px-4 py-3 text-center">Skor (Aktual)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-semibold text-red-400">Dominance (D)</td>
                  <td className="px-4 py-3 text-center">{discScore.D || 24}</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-semibold text-yellow-400">Influence (I)</td>
                  <td className="px-4 py-3 text-center">{discScore.I || 24}</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-semibold text-green-400">Steadiness (S)</td>
                  <td className="px-4 py-3 text-center">{discScore.S || 24}</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-semibold text-blue-400">Compliance (C)</td>
                  <td className="px-4 py-3 text-center">{discScore.C || 24}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Profil Karakter (HEXACO) */}
      {hexacoResult && hexacoBars.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-purple-400" /> Profil Karakter (HEXACO 100)
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {hexacoBars.map(bar => {
              // Convert 1-5 score to 1-100 percentage
              const percent = Math.round((bar.value / 5) * 100);
              return (
                <div key={bar.key} className="bg-slate-950 p-5 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-white">{bar.label}</h3>
                    <span className="text-sm font-bold" style={{ color: bar.color }}>{percent}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden mb-3">
                    <div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, backgroundColor: bar.color }}></div>
                  </div>
                  {/* Facets mock since we don't have facet data extracted directly in the standard calc yet */}
                  <div className="flex justify-between items-center text-xs text-slate-500 px-1">
                    <span>Skor Dimensi</span>
                    <span className="font-bold text-slate-400">{bar.value.toFixed(2)} / 5.00</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Profil Nilai Kerja (WVI) */}
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

      {/* 6. AI Interpretasi */}
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
                reportType="EMPLOYEE"
                clientName={client?.name}
                aiDraft={aiNarrative} 
                conflictFlags={evaluateConflicts('EMPLOYEE', {
                  hexaco: hexacoScore,
                  disc: discScore,
                  projective: graphologyResult?.calculated_score?.calculatedData || warteggResult?.calculated_score?.calculatedData,
                  wvi: wviResult?.calculated_score?.calculatedData
                })}
                onSave={async (finalHtml) => {
                  try {
                    // Cek apakah draf sudah pernah tersimpan sebelumnya untuk report ini
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
                          included_modules: ['DISC', 'HEXACO', 'GRAPHOLOGY'],
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
      
      {/* 7. Observasi & Catatan (Bottom) */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
         <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" /> Observasi & Catatan Psikolog
         </h2>
         <div className="text-slate-300">
            <ObservationForm initialData={notes} onSave={handleSaveNotes} />
         </div>
      </div>

    </div>
  );
}
