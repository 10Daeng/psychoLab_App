"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Brain, Target, Lightbulb, FileText, RefreshCw, Sparkles, Star, Download } from "lucide-react";
import RecruitmentObservationForm from "@/components/admin/RecruitmentObservationForm";
import { IQGauge } from "./SharedReportComponents";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import ClinicalWorkspace from "./ClinicalWorkspace";
import { evaluateConflicts } from "@/lib/services/conflictEngine";
import { AdvancedHexacoBox, AdvancedDiscBar, hexacoStructure, getHexacoPct, AdvancedWVIGraph } from "./SharedReportComponents";

const config = { label: "Karyawan", color: "violet", accent: "bg-violet-600", light: "bg-violet-50", text: "text-violet-700", icon: "💼" };

export default function EmployeeReportView({ report, testResults }: { report: any, testResults: any[] }) {
  const initialObs = report?.observations?.[0] || report?.observations;
  
  // Parse observasi rekrutmen (format baru: JSON string dengan kunci anamnesa)
  let parsedObsData = { observation: {}, anamnesa: {}, impression: {}, notes: "" };
  if (initialObs?.notes) {
    try {
      const inner = JSON.parse(initialObs.notes);
      if (inner.anamnesa !== undefined) {
        parsedObsData = inner;
      } else {
        parsedObsData.notes = initialObs.notes;
      }
    } catch { parsedObsData.notes = initialObs.notes || ""; }
  }
  
  const [obsData, setObsData] = useState(parsedObsData);
  const [aiNarrative, setAiNarrative] = useState<any>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState("");

  const client = report?.clients as any;
  const cogResult = testResults.find((r: any) => ["CPM", "RAVEN2"].includes(r.tests?.code));
  const wviResult = testResults.find((r: any) => r.tests?.code === "WVI");
  const hexacoResult = testResults.find((r: any) => r.tests?.code === "HEXACO");
  const discResult = testResults.find((r: any) => r.tests?.code === "DISC");
  const graphologyResult = testResults.find((r: any) => r.tests?.code === "GRAPHOLOGY");
  const warteggResult = testResults.find((r: any) => r.tests?.code === "WARTEGG");

  const cogScore = cogResult?.calculated_score || {};
  const wviScore = wviResult?.calculated_score?.calculatedData || wviResult?.calculated_score || {};
  const hexacoScore = hexacoResult?.calculated_score?.calculatedData || hexacoResult?.calculated_score || {};
  const discScore = discResult?.calculated_score?.calculatedData || discResult?.calculated_score || {};

  useEffect(() => {
    const aiSrc = cogResult?.calculated_score?.ai_narrative || discResult?.calculated_score?.ai_narrative;
    if (aiSrc) setAiNarrative(aiSrc);
  }, [cogResult, discResult]);

  const handleSaveNotes = async (dataToSave: string) => {
    try {
      // Update local state
      try {
        const inner = JSON.parse(dataToSave);
        if (inner.anamnesa !== undefined) setObsData(inner);
      } catch {}

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
        hexaco: hexacoScore,
        disc: discScore,
        projective: graphologyResult?.calculated_score?.calculatedData || warteggResult?.calculated_score?.calculatedData,
        wvi: wviScore ? { top3: Object.entries(wviScore.scores || wviScore).filter(([k,v])=>typeof v === 'number').sort((a,b)=>Number(b[1])-Number(a[1])).slice(0,3).map(x=>({name: x[0], score: Number(x[1])})) } : undefined
      });

      const payload = {
        clientName: client.name,
        context: 'EMPLOYEE',
        rawPayload: {
          hexaco: hexacoScore,
          disc: discScore,
          projective: graphologyResult?.calculated_score?.calculatedData || warteggResult?.calculated_score?.calculatedData,
          wvi: wviScore ? { top3: Object.entries(wviScore.scores || wviScore).filter(([k,v])=>typeof v === 'number').sort((a,b)=>Number(b[1])-Number(a[1])).slice(0,3).map(x=>({name: x[0], score: Number(x[1])})) } : undefined
        },
        conflictFlags: detectedFlags,
        observationData: (obsData && Object.keys(obsData.anamnesa || {}).length > 0) ? obsData : null
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
      alert("Gagal AI: " + err.message);
      setAiError(err.message);
    } finally {
      setAiGenerating(false);
    }
  };

  const iqValue = cogScore.iq || cogScore.calculatedData?.iq || 0;
  
  const discRadarData = discScore.primary_trait ? [
    { trait: "Dominance (D)", value: discScore.D || 24 },
    { trait: "Influence (I)", value: discScore.I || 24 },
    { trait: "Steadiness (S)", value: discScore.S || 24 },
    { trait: "Compliance (C)", value: discScore.C || 24 },
  ] : [];


  const hexacoBars = hexacoScore.H !== undefined ? [
    { key: "H", label: "Honesty-Humility", value: hexacoScore.H || 0, color: "#8b5cf6" },
    { key: "E", label: "Emotionality", value: hexacoScore.E || 0, color: "#ef4444" },
    { key: "X", label: "eXtraversion", value: hexacoScore.X || 0, color: "#3b82f6" },
    { key: "A", label: "Agreeableness", value: hexacoScore.A || 0, color: "#10b981" },
    { key: "C", label: "Conscientiousness", value: hexacoScore.C || 0, color: "#f97316" },
    { key: "O", label: "Openness", value: hexacoScore.O || 0, color: "#14b8a6" },
  ] : [];


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
      {discResult && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" /> Profil Gaya Kerja (DISC)
            </h2>
            <div className="bg-blue-500/20 border border-blue-500/30 text-blue-400 px-3 py-1.5 rounded-lg text-sm font-bold">
              Pola: {discScore.pattern || discScore.archetype || "-"}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <AdvancedDiscBar title="Grafik 1 — Publik (Mask)" scores={discScore.discMost || {D: discScore.D, I: discScore.I, S: discScore.S, C: discScore.C}} />
            <AdvancedDiscBar title="Grafik 2 — Pribadi (Core)" scores={discScore.discLeast || {D: discScore.D, I: discScore.I, S: discScore.S, C: discScore.C}} />
            <AdvancedDiscBar title="Grafik 3 — Aktual (Composite)" scores={discScore.discComposite || {D: discScore.D, I: discScore.I, S: discScore.S, C: discScore.C}} />
          </div>
        </div>
      )}

      {/* 4. Profil Karakter (HEXACO) */}
      {hexacoResult && hexacoScore.factorMeans && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-purple-400" /> Profil Karakter (HEXACO 100)
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {hexacoStructure.map((group) => (
              <AdvancedHexacoBox
                key={group.factor}
                group={group}
                factorMean={hexacoScore.factorMeans?.[group.factor]}
                facetMeans={hexacoScore.facetMeans}
              />
            ))}
            
            {/* Altruisme (Tambahan) */}
            {hexacoScore.facetMeans?.['altr'] && (
              <div className="md:col-span-2 bg-slate-950/80 p-5 rounded-2xl border border-slate-800 flex items-center justify-between shadow-md">
                <h3 className="font-bold text-white text-[13px] uppercase tracking-wider w-1/3">Altruisme (Tambahan)</h3>
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden relative mx-6">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${getHexacoPct(hexacoScore.facetMeans['altr'])}%`, backgroundColor: '#e67e22', opacity: 0.9 }} />
                </div>
                <span className="text-xs font-bold text-white px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#e67e22' }}>
                  {Math.round(getHexacoPct(hexacoScore.facetMeans['altr']))}%
                </span>
              </div>
            )}
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
          
          <div className="mb-4">
             <AdvancedWVIGraph scores={
                wviScore.scores || 
                Object.fromEntries(
                   Object.entries(wviScore).filter(([k, v]) => typeof v === 'number')
                )
             } />
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
          {aiError && (
            <div className="mb-6 p-4 bg-red-950/30 border border-red-900 rounded-xl flex items-start gap-3 text-red-400 text-sm">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-bold">Gagal Membuat Interpretasi AI</p>
                <p className="mt-1 opacity-80">{aiError}</p>
              </div>
            </div>
          )}
          
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
                  wvi: wviScore ? { top3: Object.entries(wviScore.scores || wviScore).filter(([k,v])=>typeof v === 'number').sort((a,b)=>Number(b[1])-Number(a[1])).slice(0,3).map(x=>({name: x[0], score: Number(x[1])})) } : undefined,
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
      
      {/* 7. Observasi Rekrutmen (Bottom) */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
         <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" /> Observasi & Catatan Psikolog
         </h2>
         <div className="text-slate-300">
            <RecruitmentObservationForm initialData={obsData} onSave={handleSaveNotes} />
         </div>
      </div>

    </div>
  );
}
