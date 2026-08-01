"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserCircle2, BrainCircuit, Activity, Download } from "lucide-react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

export default function DapResultPage({ params }: { params: { token_id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/admin/dap/${params.token_id}`);
        const data = await res.json();

        if (!res.ok) {
          router.push("/admin/dap");
          return;
        }

        setData({ token: data.tokenData, dap: data.dapData });
      } catch (error) {
        router.push("/admin/dap");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params.token_id, router]);

  const handleDownloadPdf = async () => {
    const element = document.getElementById("dap-report-content");
    if (!element) return;
    document.body.classList.add("print-mode-active");
    
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Hasil_DAP_${data.token.clients.name.replace(/\s+/g, "_")}.pdf`);
    } finally {
      document.body.classList.remove("print-mode-active");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-8 pb-32">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <Link href="/admin/dap" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Direktori</span>
          </Link>
          <button 
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)]"
          >
            <Download className="w-4 h-4" /> Unduh Laporan DAP
          </button>
        </div>

        <div id="dap-report-content" className="bg-white rounded-2xl p-8 md:p-12 shadow-2xl [.print-mode-active_&]:shadow-none [.print-mode-active_&]:rounded-none">
          {/* Header */}
          <div className="border-b-2 border-slate-200 pb-6 mb-8 text-center">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Laporan Interpretasi Tes Grafis</h1>
            <p className="text-slate-500 font-medium mt-1">Goodenough-Harris Draw-A-Person (DAP) Test</p>
          </div>

          {/* Profil */}
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 mb-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Nama Peserta</p>
              <p className="text-slate-900 font-bold">{data.token.clients.name}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Nomor Pendaftaran</p>
              <p className="text-slate-900 font-medium">{data.token.clients.test_registration_number || "-"}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Usia / Tanggal Lahir</p>
              <p className="text-slate-900 font-medium">{data.token.clients.birth_date}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Kode Token</p>
              <p className="text-slate-900 font-mono text-sm">{data.token.token_code}</p>
            </div>
          </div>

          {/* Hasil Scoring */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div className="border-l-4 border-blue-500 pl-5">
              <div className="flex items-center gap-2 mb-2">
                <BrainCircuit className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest">Kematangan Kognitif</h3>
              </div>
              <p className="text-3xl font-black text-slate-900">{data.dap.cognitive_maturity_level}</p>
              <p className="text-sm text-slate-500 mt-2">Berdasarkan kelengkapan detail anatomi dan proporsi gambar.</p>
            </div>
            <div className="border-l-4 border-emerald-500 pl-5">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest">Skor Kuantitatif DAP</h3>
              </div>
              <p className="text-3xl font-black text-slate-900">{data.dap.score} <span className="text-lg text-slate-400">/ 73</span></p>
              <p className="text-sm text-slate-500 mt-2">Total indikator (item checklist) yang berhasil dipenuhi.</p>
            </div>
          </div>

          {/* Catatan Klinis */}
          <div className="mb-10">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">Catatan Observasi Klinis</h3>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 text-slate-700 leading-relaxed min-h-[150px] whitespace-pre-wrap">
              {data.dap.clinical_notes || "Tidak ada catatan klinis tambahan yang diberikan oleh tester."}
            </div>
          </div>
          
          <div className="text-xs text-slate-400 text-center border-t border-slate-100 pt-6 mt-12">
            <p>Dokumen ini adalah hasil interpretasi parsial (Tunggal) untuk tes Draw-A-Person.</p>
            <p>Untuk kesimpulan akhir komprehensif, silakan merujuk pada Laporan Integrasi (PDF) utama.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
