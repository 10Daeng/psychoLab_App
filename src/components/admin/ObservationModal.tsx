"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ClipboardCheck, UserCircle2 } from "lucide-react";
import ObservationForm from "@/app/admin/reports/[id]/ObservationForm";
import toast from "react-hot-toast";

interface ObservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenId: string;
  clientName: string;
  tokenCode: string;
  onSuccess?: () => void;
}

export default function ObservationModal({ isOpen, onClose, tokenId, clientName, tokenCode, onSuccess }: ObservationModalProps) {
  const [loading, setLoading] = useState(true);
  const [notesData, setNotesData] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchData() {
      try {
        setLoading(true);
        const resObs = await fetch(`/api/admin/reports/${tokenId}/notes`);
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
    fetchData();
  }, [isOpen, tokenId]);

  const handleSaveNotes = async (dataToSave: string) => {
    try {
      const res = await fetch(`/api/admin/reports/${tokenId}/notes`, {
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
      throw err; // Lempar error agar form tau kalau gagal
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-50 border border-slate-200 rounded-3xl w-full max-w-4xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center border border-teal-200">
                <ClipboardCheck className="w-6 h-6 text-teal-700" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Form Observasi & Wawancara
                </h2>
                <p className="text-slate-500 text-sm mt-1">Klien: <span className="font-semibold text-slate-700">{clientName}</span> <span className="text-xs bg-slate-200 px-2 py-0.5 rounded font-mono ml-2">{tokenCode}</span></p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition p-2 rounded-xl hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-8 h-8 border-4 border-teal-500/30 border-t-teal-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              notesData && (
                <ObservationForm 
                  initialData={JSON.stringify({
                    notes: notesData.notes || "",
                    observation: notesData.observation || {},
                    interview: notesData.interview || {}
                  })} 
                  onSave={handleSaveNotes} 
                />
              )
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
