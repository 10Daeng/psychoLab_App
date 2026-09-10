"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

const PDFExport = dynamic(() => import("@/components/pdf/PDFExport"), { ssr: false });

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

  // Kumpulkan props untuk PDFExport
  const pdfProps = {
    report,
    testResults,
    client,
    ageYears,
    ageMonths,
    dateStr,
    aiNarrative,
    clientReports
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 py-12 px-4 flex flex-col items-center">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-slate-800">
          Laporan Cetak (PDF)
        </h2>
        
        <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded-xl text-left space-y-2 border border-slate-100">
          <p><strong>Klien:</strong> {client?.name}</p>
          <p><strong>Kode Laporan:</strong> {report?.token_code}</p>
          <p><strong>Status:</strong> Siap untuk diunduh.</p>
        </div>
        
        <p className="text-slate-600 text-sm">
          Sistem cetak kini menggunakan engine PDF native untuk memastikan hasil yang rapi dan konsisten (mengadopsi standar <strong>Lentera Batin</strong>).
        </p>

        <div className="pt-4 border-t border-slate-100">
          <PDFExport {...pdfProps} />
        </div>

        <button 
          onClick={() => window.close()} 
          className="mt-4 text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors"
        >
          Kembali / Tutup Halaman
        </button>
      </div>
    </div>
  );
}
