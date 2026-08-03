"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Brain, Target, FileText, RefreshCw, Sparkles, TrendingUp, BarChart2, Star, Lightbulb } from "lucide-react";
import ObservationForm from "@/app/admin/reports/[id]/ObservationForm";
import { IQGauge } from "./SharedReportComponents";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import ClinicalWorkspace from "./ClinicalWorkspace";
import { evaluateConflicts } from "@/lib/services/conflictEngine";

const config = { label: "Siswa", color: "teal", accent: "bg-teal-500", light: "bg-teal-50", text: "text-teal-700", icon: "📚" };

export default function StudentReportView({ report, testResults }: { report: any, testResults: any[] }) {
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
  const wviResult = testResults.find((r: any) => r.tests?.code === "WVI");
  const hexacoResult = testResults.find((r: any) => r.tests?.code === "HEXACO");

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
      const detectedFlags = evaluateConflicts('STUDENT', {
        cognitive: { ravenScore: cogScore.rawScore || cogScore.totalRawScore },
        sds: { topHollandCodes: riasecScore ? Object.entries(riasecScore).sort((a,b)=>Number(b[1])-Number(a[1])).slice(0,3).map(x=>({R:'Realistic',I:'Investigative',A:'Artistic',S:'Social',E:'Enterprising',C:'Conventional'})[x[0]]||x[0]) : [] },
        wvi: wviScore ? { topValues: Object.entries(wviScore).sort((a,b)=>Number(b[1])-Number(a[1])).slice(0,3).map(x=>x[0]) } : undefined,
        hexaco: hexacoScore
      });

      const payload = {
        clientName: client.name,
        context: 'STUDENT',
        rawPayload: {
          cognitive: { ravenScore: cogScore.rawScore || cogScore.totalRawScore },
          sds: { topHollandCodes: riasecScore ? Object.entries(riasecScore).sort((a,b)=>Number(b[1])-Number(a[1])).slice(0,3).map(x=>({R:'Realistic',I:'Investigative',A:'Artistic',S:'Social',E:'Enterprising',C:'Conventional'})[x[0]]||x[0]) : [] },
          wvi: wviScore ? { topValues: Object.entries(wviScore).sort((a,b)=>Number(b[1])-Number(a[1])).slice(0,3).map(x=>x[0]) } : undefined,
          hexaco: hexacoScore
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

      const targetToUpdate = cogResult || riasecResult;
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
  
  const riasecScore = riasecResult?.calculated_score?.calculatedData || riasecResult?.calculated_score || {};
  const riasecBars = riasecScore ? Object.entries(riasecScore)
    .filter(([k]) => ["R", "I", "A", "S", "E", "C"].includes(k))
    .map(([k, v]) => ({
      key: k,
      label: { R: "Realistic", I: "Investigative", A: "Artistic", S: "Social", E: "Enterprising", C: "Conventional" }[k] || k,
      value: v as number,
      color: { R: "#6366f1", I: "#0ea5e9", A: "#f43f5e", S: "#22c55e", E: "#f59e0b", C: "#a855f7" }[k] || "#64748b",
    })) : [];

  const vakScore = vakResult?.calculated_score?.calculatedData || {};
  const wviScore = wviResult?.calculated_score?.calculatedData || wviResult?.calculated_score;
  const hexacoScore = hexacoResult?.calculated_score?.calculatedData || hexacoResult?.calculated_score;

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
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">NISN / ID</p>
            <p className="text-base font-bold text-white">{client?.registration_number || "-"}</p>
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
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Asal Sekolah / Instansi</p>
            <p className="text-base font-bold text-white">{client?.school_or_institution || "-"}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Kelas</p>
            <p className="text-base font-bold text-white">{client?.grade || "-"}</p>
          </div>
        </div>
      </div>

      {/* 2. Kognitif (RAVEN/CPM) */}
      {cogResult && iqValue > 0 && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-teal-400" /> Profil Kognitif ({cogResult.tests?.code})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            <div className="col-span-1 flex justify-center">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 w-full max-w-[200px] flex justify-center">
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

      {/* 3. Minat & Bakat (RIASEC) */}
      {riasecResult && riasecBars.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-400" /> Profil Minat Karir (RIASEC / SDS)
            </h2>
            {riasecScore.top_code && (
              <div className="bg-teal-500/20 border border-teal-500/30 text-teal-400 px-3 py-1.5 rounded-lg text-sm font-bold">
                Kode Dominan: {riasecScore.top_code}
              </div>
            )}
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={riasecBars} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: 8 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
                {riasecBars.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 4. Profil Nilai Kerja (WVI) - Optional for students */}
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

      {/* 5. Gaya Belajar (VAK) */}
      {vakResult && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-emerald-500" /> Gaya Belajar (VAK)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { key: "V", label: "Visual", color: "blue", border: "border-blue-500/50", bg: "bg-blue-500/10", text: "text-blue-400" },
              { key: "A", label: "Auditory", color: "purple", border: "border-purple-500/50", bg: "bg-purple-500/10", text: "text-purple-400" },
              { key: "K", label: "Kinesthetic", color: "emerald", border: "border-emerald-500/50", bg: "bg-emerald-500/10", text: "text-emerald-400" },
            ].map(({ key, label, border, bg, text }) => {
              const val = vakScore?.[key] || 0;
              const isDominant = vakScore?.dominant === label || val === Math.max(vakScore?.V || 0, vakScore?.A || 0, vakScore?.K || 0);
              return (
                <div key={key} className={`rounded-xl p-6 text-center border ${isDominant ? `${border} ${bg}` : "border-slate-800 bg-slate-950"}`}>
                  <p className={`text-4xl font-black ${isDominant ? text : "text-slate-500"}`}>{val}</p>
                  <p className={`text-sm font-bold mt-2 ${isDominant ? text : "text-slate-400"}`}>{label}</p>
                  {isDominant && <span className={`text-[10px] font-bold ${bg} ${text} border ${border} px-2 py-1 rounded-full mt-3 inline-block uppercase tracking-wider`}>Dominan</span>}
                </div>
              );
            })}
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
                reportType="STUDENT"
                clientName={client?.name}
                aiDraft={aiNarrative} 
                conflictFlags={evaluateConflicts('STUDENT', {
                  cognitive: { ravenScore: cogScore.rawScore || cogScore.totalRawScore },
                  sds: { topHollandCodes: riasecScore ? Object.entries(riasecScore).sort((a,b)=>Number(b[1])-Number(a[1])).slice(0,3).map(x=>({R:'Realistic',I:'Investigative',A:'Artistic',S:'Social',E:'Enterprising',C:'Conventional'})[x[0]]||x[0]) : [] },
                  wvi: wviScore ? { topValues: Object.entries(wviScore).sort((a,b)=>Number(b[1])-Number(a[1])).slice(0,3).map(x=>x[0]) } : undefined,
                  hexaco: hexacoScore
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
                          included_modules: ['RAVEN', 'SDS', 'WVI', 'VAK'],
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
            <FileText className="w-5 h-5 text-emerald-400" /> Observasi & Catatan Konselor
         </h2>
         <div className="text-slate-300">
            <ObservationForm initialData={notes} onSave={handleSaveNotes} />
         </div>
      </div>

    </div>
  );
}
