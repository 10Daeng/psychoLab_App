"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";

import ChildPrintView from "@/components/reports/ChildPrintView";
import StudentPrintView from "@/components/reports/StudentPrintView";
import EmployeePrintView from "@/components/reports/EmployeePrintView";

export default function PrintReportPage() {
  const params = useParams();
  const reportId = params.id as string;

  const [report, setReport] = useState<any>(null);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [segment, setSegment] = useState<"CHI" | "STU" | "EMP">("CHI");
  const [viewMode, setViewMode] = useState<"CLEAN" | "FULL">("CLEAN");

  useEffect(() => {
    if (report) {
      const timer = setTimeout(() => window.print(), 1000);
      return () => clearTimeout(timer);
    }
  }, [report]);

  useEffect(() => {
    if (!reportId) return;
    async function fetchReport() {
      try {
        const res = await fetch(`/api/admin/reports/${reportId}`);
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error);

        setReport(data.report);

        const tokenCode = data.report?.token_code || "";
        const seg: "CHI" | "STU" | "EMP" = tokenCode.startsWith("CHI-") ? "CHI" : tokenCode.startsWith("STU-") ? "STU" : "EMP";
        setSegment(seg);

        setTestResults(data.testResults || []);
      } catch (err) {
        console.error("Gagal memuat laporan:", err);
        alert("Gagal memuat laporan.");
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [reportId]);

  if (loading) return <div className="p-8 text-center text-slate-500">Menyiapkan dokumen cetak...</div>;
  if (!report) return <div className="p-8 text-center text-red-500">Data tidak ditemukan.</div>;

  const client = report.clients as any;
  const birth = client?.birth_date ? new Date(client.birth_date) : null;
  const start = report?.created_at ? new Date(report.created_at) : null;
  
  let ageYears = 0, ageMonths = 0;
  if (birth && start) {
    ageYears = start.getFullYear() - birth.getFullYear();
    ageMonths = start.getMonth() - birth.getMonth();
    if (ageMonths < 0) {
      ageYears--;
      ageMonths += 12;
    }
  }

  // Find the AI Narrative from one of the core tests
  const cogResult = testResults.find((r: any) => ["CPM", "RAVEN2"].includes(r.tests?.code));
  const discResult = testResults.find((r: any) => r.tests?.code === "DISC");
  const riasecResult = testResults.find((r: any) => ["SDS", "RIASEC"].includes(r.tests?.code));
  
  const aiNarrative = cogResult?.calculated_score?.ai_narrative 
                   || discResult?.calculated_score?.ai_narrative 
                   || riasecResult?.calculated_score?.ai_narrative 
                   || null;

  const initialObs = report.observations?.[0] || report.observations;
  let notesData = { isJson: false, notes: report.psychologist_notes || "", obs: {} as any, inv: {} as any };
  try {
    if (initialObs) {
      notesData = { 
        isJson: true, 
        notes: initialObs.notes || "", 
        obs: initialObs.observation_data || {}, 
        inv: initialObs.interview_data || {} 
      };
    } else if (report.psychologist_notes?.startsWith('{')) {
      const parsed = JSON.parse(report.psychologist_notes);
      notesData = { isJson: true, notes: parsed.notes, obs: parsed.observation || {}, inv: parsed.interview || {} };
    }
  } catch (e) {}

  const dateStr = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date());

  const cleanModeLabel = segment === "CHI" ? "Mode Orangtua" : segment === "STU" ? "Mode Orangtua/Siswa" : "Mode Publik";
  const fullModeLabel = segment === "EMP" ? "Mode Perusahaan" : "Mode Guru & Sekolah";

  return (
    <div className="bg-white min-h-screen text-slate-900">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background-color: white; padding: 0; margin: 0; font-family: sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          @page { margin: 15mm; }
          .page-break { page-break-before: always; }
          .keep-together { page-break-inside: avoid; }
        }
      `}} />

      {/* KONTROL CETAK (hanya di layar) */}
      <div className="no-print sticky top-0 z-50 mb-8 bg-white p-4 border-b border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 max-w-4xl mx-auto mt-4 rounded-xl">
        <div>
          <h3 className="font-bold text-slate-800">Mode Laporan Cetak</h3>
          <p className="text-xs text-slate-500">Pilih versi laporan yang akan dicetak</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode("CLEAN")}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${viewMode === "CLEAN" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-800"}`}
          >
            👨‍👩‍👧 {cleanModeLabel}
          </button>
          <button
            onClick={() => setViewMode("FULL")}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${viewMode === "FULL" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-800"}`}
          >
            🏫 {fullModeLabel} (Lengkap)
          </button>
        </div>
        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
        >
          🖨️ Cetak / Simpan PDF
        </button>
      </div>

      {/* KONTEN LAPORAN */}
      <div className="max-w-4xl mx-auto py-4 px-8 print:px-0 print:max-w-full">
        {/* KOP SURAT */}
        <div className="text-center mb-8 border-b-4 border-slate-800 pb-6 keep-together">
          <h2 className="text-base text-slate-500 font-semibold mb-0.5">Lembaga Konseling dan Psikoterapi Islam</h2>
          <h1 className="text-3xl font-black text-slate-800 mb-1">Lentera Batin Assessment</h1>
          <p className="text-xs text-slate-500">Jalan Potre Koneng II No. 31, Kolor, Sumenep 69417 | www.lenterabatin.co.id</p>
          <div className="mt-6 border-t border-slate-300 pt-4">
            <h2 className="text-lg font-bold uppercase tracking-wider">
              {segment === "CHI" ? "Laporan Kesiapan Sekolah & Perkembangan" : segment === "STU" ? "Laporan Penjurusan & Minat Karir" : "Laporan Hasil Pemeriksaan Psikologis"}
            </h2>
            <p className="text-xs font-bold text-slate-500 mt-1">
              RAHASIA — CONFIDENTIAL | Kode: {report.token_code}
            </p>
          </div>
        </div>

        {segment === "CHI" && (
          <ChildPrintView 
            report={report} testResults={testResults} client={client} 
            ageYears={ageYears} ageMonths={ageMonths} dateStr={dateStr} 
            viewMode={viewMode} aiNarrative={aiNarrative} notesData={notesData} 
          />
        )}
        
        {segment === "STU" && (
          <StudentPrintView 
            report={report} testResults={testResults} client={client} 
            ageYears={ageYears} ageMonths={ageMonths} dateStr={dateStr} 
            viewMode={viewMode} aiNarrative={aiNarrative} notesData={notesData} 
          />
        )}
        
        {segment === "EMP" && (
          <EmployeePrintView 
            report={report} testResults={testResults} client={client} 
            ageYears={ageYears} ageMonths={ageMonths} dateStr={dateStr} 
            viewMode={viewMode} aiNarrative={aiNarrative} notesData={notesData} 
          />
        )}

        {/* TANDA TANGAN */}
        <div className="mt-16 flex justify-end keep-together">
          <div className="text-center w-64">
            <p className="text-sm mb-20">Sumenep, {dateStr}</p>
            <p className="font-bold border-b border-black pb-1 mb-1">
              Psikolog / Asesor Pemeriksa
            </p>
            <p className="text-xs text-slate-500">SIPP: ___________________</p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-12 pt-4 border-t border-slate-300 text-center text-[10px] text-slate-500">
          Laporan ini diterbitkan secara otomatis oleh sistem asesmen Lentera Batin | Dibuat: {dateStr} | www.lenterabatin.co.id
        </div>
      </div>
    </div>
  );
}
