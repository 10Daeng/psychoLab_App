"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Briefcase } from "lucide-react";
import RecruitmentObservationForm from "@/components/admin/RecruitmentObservationForm";
import toast from "react-hot-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tokenId: string;
  clientName: string;
  tokenCode: string;
  onSuccess?: () => void;
}

export default function RecruitmentObservationModal({
  isOpen, onClose, tokenId, clientName, tokenCode, onSuccess
}: Props) {
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/reports/${tokenId}/notes`);
        const data = await res.json();

        if (data.success) {
          // notes field contains the JSON string of our recruitment obs payload
          let parsed = { observation: {}, anamnesa: {}, impression: {}, notes: "" };
          if (data.notes) {
            try {
              const inner = JSON.parse(data.notes);
              // Support both new format (has anamnesa key) and old format
              if (inner.anamnesa !== undefined) {
                parsed = inner;
              } else {
                parsed.notes = data.notes;
              }
            } catch {
              parsed.notes = data.notes;
            }
          }
          setFormData(parsed);
        } else {
          setFormData({ observation: {}, anamnesa: {}, impression: {}, notes: "" });
        }
      } catch (error: any) {
        toast.error("Gagal mengambil data observasi: " + error.message);
        setFormData({ observation: {}, anamnesa: {}, impression: {}, notes: "" });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [isOpen, tokenId]);

  const handleSave = async (dataToSave: string) => {
    const res = await fetch(`/api/admin/reports/${tokenId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: dataToSave }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    toast.success("Observasi rekrutmen berhasil disimpan!");
    if (onSuccess) onSuccess();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-50 border border-slate-200 rounded-3xl w-full max-w-3xl shadow-[0_0_60px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-white flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center border border-teal-200">
                <Briefcase className="w-6 h-6 text-teal-700" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Lembar Observasi Rekrutmen</h2>
                <p className="text-slate-500 text-sm mt-0.5">
                  Kandidat: <span className="font-semibold text-slate-700">{clientName}</span>
                  <span className="text-xs bg-slate-200 px-2 py-0.5 rounded font-mono ml-2">{tokenCode}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition p-2 rounded-xl hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-8 h-8 border-4 border-teal-500/30 border-t-teal-600 rounded-full animate-spin" />
              </div>
            ) : (
              formData && (
                <RecruitmentObservationForm
                  initialData={formData}
                  onSave={handleSave}
                />
              )
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
