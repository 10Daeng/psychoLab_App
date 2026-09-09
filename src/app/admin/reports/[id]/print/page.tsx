"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";

import ChildPrintView from "@/components/reports/ChildPrintView";
import StudentPrintView from "@/components/reports/StudentPrintView";
import EmployeePrintView from "@/components/reports/EmployeePrintView";

export default function PrintReportPage() {
  const params = useParams();
  const reportId = params.id as string;

  const [report, setReport] = useState<any>(null);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [clientReports, setClientReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [segment, setSegment] = useState<"CHI" | "STU" | "EMP">("CHI");
  const [viewMode, setViewMode] = useState<"CLEAN" | "FULL">("CLEAN");

  const searchParams = useSearchParams();
  const autoDownload = searchParams.get("download") === "1";
  
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (report && autoDownload) {
      const timer = setTimeout(() => handleDownloadPDF(), 1000);
      return () => clearTimeout(timer);
    }
  }, [report, autoDownload]);

  const handleDownloadPDF = () => {
    window.print();
    if (autoDownload) {
      setTimeout(() => window.close(), 1000);
    }
  };

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
        setClientReports(data.clientReports || []);
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
        @media print {
          body { background-color: white; padding: 0; margin: 0; font-family: 'Times New Roman', Times, serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          @page {
            margin: 18mm 15mm 20mm 15mm;
            size: A4 portrait;
            /* Footer per halaman dengan timestamp */
            @bottom-center {
              content: 'Dokumen Rahasia | Lentera Batin Assessment | Dicetak: ${dateStr}';
              font-size: 7pt;
              color: #94a3b8;
              font-family: Helvetica, Arial, sans-serif;
            }
            @bottom-right {
              content: 'Halaman ' counter(page);
              font-size: 7pt;
              color: #94a3b8;
              font-family: Helvetica, Arial, sans-serif;
            }
          }
          .page-break { page-break-before: always; break-before: page; }
          .break-before-page { page-break-before: always; break-before: page; }
          .keep-together { page-break-inside: avoid; break-inside: avoid; }
          /* Watermark RAHASIA di pojok kanan atas setiap halaman */
          .print-watermark {
            position: fixed;
            top: 8mm;
            right: 12mm;
            font-size: 9pt;
            font-weight: bold;
            color: #dc2626;
            font-family: Helvetica, Arial, sans-serif;
            letter-spacing: 0.5px;
          }
          .print-watermark { display: block !important; }
          .print-watermark-hidden { display: none !important; }
          /* Print color untuk psikogram */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
        @media screen {
          .print-watermark { display: none; }
        }
      `}} />

      {/* KONTROL CETAK (hanya di layar) */}
      <div className="no-print sticky top-0 z-50 mb-8 bg-white p-4 border-b border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 max-w-4xl mx-auto mt-4 rounded-xl">
        <div className="flex-1">
          <h3 className="font-bold text-slate-800">Laporan Cetak</h3>
          <p className="text-xs text-slate-500">Pratinjau dokumen sebelum mencetak</p>
        </div>
        {segment !== "CHI" && (
          <div className="flex bg-slate-100 p-1 rounded-lg mr-4">
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
        )}
        <button
          onClick={handleDownloadPDF}
          disabled={isGeneratingPdf}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {isGeneratingPdf ? "⏳ Menyusun PDF..." : "🖨️ Cetak / Simpan PDF"}
        </button>
      </div>

      {/* Watermark RAHASIA — hanya tampil saat print di setiap halaman */}
      <div className="print-watermark" aria-hidden="true">⬛ SANGAT RAHASIA</div>

      {/* KONTEN LAPORAN */}
      <div ref={reportRef} className="max-w-4xl mx-auto py-4 px-8 print:px-0 print:max-w-full bg-white">
        {/* KOP SURAT */}
        <div className="text-center mb-8 border-b-4 border-double border-slate-800 pb-6 keep-together">
          {/* Logo area */}
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center shadow-sm" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as any}>
              <span className="text-white text-2xl font-black">LB</span>
            </div>
            <div className="text-left">
              <h2 className="text-[11px] text-slate-500 font-semibold tracking-widest uppercase">Lembaga Konseling dan Psikoterapi Islam</h2>
              <h1 className="text-2xl font-black text-slate-800 leading-tight">LENTERA BATIN</h1>
              <p className="text-[10px] text-slate-400">Jl. Potre Koneng II No. 31, Kolor, Sumenep 69417 &nbsp;|&nbsp; www.lenterabatin.co.id</p>
            </div>
          </div>
          <div className="mt-5 border-t-2 border-slate-300 pt-4">
            <h2 className="text-[15px] font-black uppercase tracking-widest text-slate-800">
              {segment === "CHI" ? "Laporan Hasil Pemeriksaan Psikologis" : segment === "STU" ? "Laporan Penjurusan & Minat Karir" : "Laporan Hasil Pemeriksaan Psikologis"}
            </h2>
            <p className="text-[10px] font-bold text-slate-500 mt-2 tracking-wider">
              DOKUMEN RAHASIA — CONFIDENTIAL &nbsp;|&nbsp; Kode: {report.token_code}
            </p>
          </div>
        </div>

        {segment === "CHI" && (
          <ChildPrintView 
            report={report} testResults={testResults} client={client} 
            ageYears={ageYears} ageMonths={ageMonths} dateStr={dateStr} 
            aiNarrative={aiNarrative} notesData={notesData} 
            clientReports={clientReports}
          />
        )}
        
        {segment === "STU" && (
          <StudentPrintView 
            report={report} testResults={testResults} client={client} 
            ageYears={ageYears} ageMonths={ageMonths} dateStr={dateStr} 
            viewMode={viewMode} aiNarrative={aiNarrative} notesData={notesData} 
            clientReports={clientReports}
          />
        )}
        
        {segment === "EMP" && (
          <EmployeePrintView 
            report={report} testResults={testResults} client={client} 
            ageYears={ageYears} ageMonths={ageMonths} dateStr={dateStr} 
            viewMode={viewMode} aiNarrative={aiNarrative} notesData={notesData}
            clientReports={clientReports}
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
