"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Download, ArrowLeft } from "lucide-react";

import ChildReportView from "@/components/reports/ChildReportView";
import StudentReportView from "@/components/reports/StudentReportView";
import EmployeeReportView from "@/components/reports/EmployeeReportView";

const segmentConfig = {
  CHI: { label: "Anak", color: "orange", accent: "bg-orange-500", light: "bg-orange-50", text: "text-orange-700", icon: "🪔" },
  STU: { label: "Siswa", color: "teal", accent: "bg-teal-500", light: "bg-teal-50", text: "text-teal-700", icon: "📚" },
  EMP: { label: "Karyawan", color: "violet", accent: "bg-violet-600", light: "bg-violet-50", text: "text-violet-700", icon: "💼" },
};

export default function LenteraReportPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const [report, setReport] = useState<any>(null);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [segment, setSegment] = useState<"CHI" | "STU" | "EMP">("CHI");

  const fetchReport = useCallback(async () => {
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
      console.error("Failed to fetch report:", err);
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    if (reportId) fetchReport();
  }, [reportId, fetchReport]);

  const handleDownloadPDF = () => {
    router.push(`/admin/reports/${reportId}/print`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-700 border-t-violet-500 rounded-full animate-spin mx-auto" />
          <p className="mt-6 text-slate-400">Memuat Laporan Lentera Batin...</p>
        </div>
      </div>
    );
  }

  const config = segmentConfig[segment];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      {/* Top Navigation */}
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali
            </button>
            <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${config.accent} text-white`}>
              {config.icon} {config.label} — {report?.token_code}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/admin/reports/${reportId}/graphology`)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md"
            >
              ✍️ Input Grafologi
            </button>
            <button
              onClick={() => router.push(`/admin/reports/${reportId}/wartegg`)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md"
            >
              ⬛ Input Wartegg
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md"
            >
              <Download className="w-4 h-4" /> Cetak / PDF
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        {segment === "CHI" && <ChildReportView report={report} testResults={testResults} />}
        {segment === "STU" && <StudentReportView report={report} testResults={testResults} />}
        {segment === "EMP" && <EmployeeReportView report={report} testResults={testResults} />}
      </div>
    </div>
  );
}
