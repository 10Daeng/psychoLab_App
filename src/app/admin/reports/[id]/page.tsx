"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
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
      const { data: tokenData, error } = await supabase
        .from("tokens")
        .select("*, clients(*)")
        .eq("id", reportId)
        .single();

      if (error) throw error;
      setReport(tokenData);

      const tokenCode = tokenData?.token_code || "";
      const seg: "CHI" | "STU" | "EMP" = tokenCode.startsWith("CHI-") ? "CHI" : tokenCode.startsWith("STU-") ? "STU" : "EMP";
      setSegment(seg);

      const { data: results } = await supabase
        .from("test_results")
        .select("*, tests(code, name)")
        .eq("token_id", reportId);

      setTestResults(results || []);

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto" />
          <p className="mt-6 text-slate-600">Memuat Laporan Lentera Batin...</p>
        </div>
      </div>
    );
  }

  const config = segmentConfig[segment];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali
            </button>
            <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${config.accent} text-white`}>
              {config.icon} {config.label} — {report?.token_code}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md"
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
