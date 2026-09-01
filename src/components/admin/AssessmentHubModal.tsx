"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ClipboardCheck, UserCircle2, CheckCircle2, FileBarChart2, PenTool, LayoutDashboard } from "lucide-react";
import ObservationForm from "@/app/admin/reports/[id]/ObservationForm";
import DapScoringEngine from "@/components/admin/DapScoringModal"; // (Optional/Future: import DAP engine here)
import toast from "react-hot-toast";

interface AssessmentHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: any;
  onSuccess?: () => void;
}

export default function AssessmentHubModal({ isOpen, onClose, client, onSuccess }: AssessmentHubModalProps) {
  const [activeTab, setActiveTab] = useState<"OBSERVATION" | "PARENT_Q" | "DAP" | "STATUS">("STATUS");
  const [loading, setLoading] = useState(true);
  const [notesData, setNotesData] = useState<any>(null);
  
  const childToken = client?.tokens?.find((t: any) => t.respondent_type === 'SELF');
  const parentToken = client?.tokens?.find((t: any) => t.respondent_type === 'PARENT');

  // Load Observation data (from child token)
  useEffect(() => {
    if (!isOpen || !childToken?.id) return;

    async function fetchNotes() {
      try {
        setLoading(true);
        const resObs = await fetch(`/api/admin/reports/${childToken.id}/notes`);
        const dataObs = await resObs.json();
        
        if (dataObs.success) {
          setNotesData(dataObs);
        } else {
          setNotesData({ notes: "", observation: {}, interview: {} });
        }
      } catch (error: any) {
        toast.error("Gagal mengambil data observasi: " + error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchNotes();
  }, [isOpen, childToken?.id]);

  const handleSaveNotes = async (dataToSave: string) => {
    try {
      const res = await fetch(`/api/admin/reports/${childToken.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: dataToSave }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      
      toast.success("Observasi berhasil disimpan!");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error("Gagal menyimpan catatan: " + err.message);
      throw err;
    }
  };

  const handleFinalizeToken = async (tokenId: string) => {
    if (!confirm("Tandai token ini sebagai selesai? Peserta tidak akan bisa login lagi dengan token ini.")) return;
    try {
      const res = await fetch('/api/admin/finalize-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Token berhasil diselesaikan!");
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (!isOpen || !client) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-50 border border-slate-200 rounded-3xl w-full max-w-5xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center border border-indigo-200">
                <LayoutDashboard className="w-6 h-6 text-indigo-700" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Assessment Hub - Kelola Penilaian
                </h2>
                <p className="text-slate-500 text-sm mt-1">Klien: <span className="font-semibold text-slate-700">{client.name}</span></p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition p-2 rounded-xl hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Tabs */}
            <div className="w-64 bg-slate-100 border-r border-slate-200 p-4 flex flex-col gap-2">
              <button
                onClick={() => setActiveTab("STATUS")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === "STATUS" ? "bg-indigo-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-200"}`}
              >
                <CheckCircle2 className="w-4 h-4" /> Status & Token
              </button>
              <button
                onClick={() => setActiveTab("OBSERVATION")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === "OBSERVATION" ? "bg-indigo-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-200"}`}
              >
                <ClipboardCheck className="w-4 h-4" /> Observasi & Wawancara
              </button>
              <button
                onClick={() => setActiveTab("PARENT_Q")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === "PARENT_Q" ? "bg-indigo-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-200"}`}
              >
                <UserCircle2 className="w-4 h-4" /> Kuesioner Ortu
              </button>
              {/* <button
                onClick={() => setActiveTab("DAP")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === "DAP" ? "bg-indigo-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-200"}`}
              >
                <PenTool className="w-4 h-4" /> Penilaian Grafis (DAP)
              </button> */}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50 relative">
              {activeTab === "STATUS" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Status Pengerjaan</h3>
                  
                  {/* Child Token */}
                  {childToken ? (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500 font-semibold mb-1">Token Klien (Anak/Remaja)</p>
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-mono font-bold text-slate-800">{childToken.token_code}</span>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${childToken.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {childToken.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {childToken.status !== 'COMPLETED' ? (
                          <button onClick={() => handleFinalizeToken(childToken.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                            Tandai Selesai
                          </button>
                        ) : (
                          <a href={`/admin/reports/${childToken.id}/print?download=1`} target="_blank" rel="noopener noreferrer" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors text-center">
                            Lihat & Unduh PDF
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">Token Anak belum digenerate.</p>
                  )}

                  {/* Parent Token */}
                  {parentToken ? (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500 font-semibold mb-1">Token Pendamping (Orang Tua)</p>
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-mono font-bold text-slate-800">{parentToken.token_code}</span>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${parentToken.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {parentToken.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                         {parentToken.status !== 'COMPLETED' && (
                          <button onClick={() => handleFinalizeToken(parentToken.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                            Tandai Selesai
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">Token Orang Tua belum digenerate.</p>
                  )}
                </div>
              )}

              {activeTab === "OBSERVATION" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Catatan Observasi & Wawancara Klinis</h3>
                  {loading ? (
                    <div className="flex justify-center items-center py-20">
                      <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin"></div>
                    </div>
                  ) : notesData ? (
                    <ObservationForm 
                      initialData={JSON.stringify({
                        notes: notesData.notes || "",
                        observation: notesData.observation || {},
                        interview: notesData.interview || {}
                      })} 
                      onSave={handleSaveNotes} 
                    />
                  ) : (
                    <p className="text-slate-500 text-sm text-center py-10">Data tidak tersedia. (Pastikan token anak sudah digenerate)</p>
                  )}
                </div>
              )}

              {activeTab === "PARENT_Q" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Kuesioner Orang Tua</h3>
                  {parentToken ? (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${parentToken.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          Status: {parentToken.status}
                        </span>
                      </div>
                      
                      {parentToken.status === 'COMPLETED' ? (
                        <div className="text-center p-10 border border-dashed border-slate-300 rounded-xl">
                          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                          <h4 className="font-bold text-slate-700 mb-2">Orang tua telah selesai mengisi kuesioner.</h4>
                          <p className="text-sm text-slate-500 mb-4">Hasil kuesioner orang tua (Riwayat, SDQ, ABIC) akan otomatis terlampir di Laporan PDF Anak.</p>
                          <a href={`/admin/reports/${childToken?.id}/print?download=1`} target="_blank" className="text-indigo-600 hover:underline font-semibold text-sm">Lihat Laporan PDF</a>
                        </div>
                      ) : (
                        <div className="text-center p-10 border border-dashed border-slate-300 rounded-xl">
                          <UserCircle2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                          <h4 className="font-bold text-slate-700 mb-2">Orang tua belum menyelesaikan kuesioner.</h4>
                          <p className="text-sm text-slate-500 mb-4">Arahkan orang tua untuk login menggunakan token <strong className="text-indigo-600">{parentToken.token_code}</strong></p>
                          <a href={`/login`} target="_blank" className="inline-block bg-slate-100 border border-slate-300 px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors">Buka Halaman Login</a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm text-center py-10">Token Orang Tua belum digenerate.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
