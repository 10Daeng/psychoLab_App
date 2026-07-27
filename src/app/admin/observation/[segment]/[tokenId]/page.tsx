"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, User, Calendar, ClipboardCheck } from "lucide-react";
import ObservationForm from "@/app/admin/reports/[id]/ObservationForm";

export default function ObservationFormPage({ params }: { params: Promise<{ segment: string, tokenId: string }> }) {
  const { segment, tokenId } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tokenData, setTokenData] = useState<any>(null);
  const [notesData, setNotesData] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [tokenId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch token and client info
      const resToken = await fetch(`/api/admin/get-tokens`);
      const dataToken = await resToken.json();
      if (dataToken.success) {
        const t = dataToken.tokens.find((x: any) => x.id === tokenId);
        setTokenData(t);
      }

      // 2. Fetch observations data
      const resObs = await fetch(`/api/admin/reports/${tokenId}/notes`);
      const dataObs = await resObs.json();
      
      if (dataObs.success) {
        setNotesData(dataObs);
      }

    } catch (error) {
      console.error("Gagal mengambil data observasi:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async (dataToSave: string) => {
    // dataToSave comes from ObservationForm.tsx which currently sends JSON.stringify({notes, observation, interview})
    // Our updated API in notes/route.ts supports this format
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/reports/${tokenId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: dataToSave }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
    } catch (err: any) {
      alert("Gagal menyimpan catatan: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Memuat form observasi...</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link 
        href={`/admin/observation/${segment}`}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-6 font-semibold"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 mb-8">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between border-b border-slate-100 pb-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center">
              <ClipboardCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Form Observasi & Wawancara</h1>
              <p className="text-slate-500 mt-1">Lengkapi data observasi untuk dimasukkan ke laporan akhir.</p>
            </div>
          </div>
          
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-2 min-w-[250px]">
            <div className="flex items-center gap-3 text-sm">
              <User className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-700">{tokenData?.clients?.name || "Klien Belum Ada"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">{tokenData?.created_at ? new Date(tokenData.created_at).toLocaleDateString("id-ID") : "-"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-4 text-center text-slate-400 font-mono text-xs">#</div>
              <span className="font-mono text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded text-xs">{tokenData?.token_code}</span>
            </div>
          </div>
        </div>

        {notesData && (
          <ObservationForm 
            initialData={JSON.stringify({
              notes: notesData.notes,
              observation: notesData.observation,
              interview: notesData.interview
            })} 
            onSave={handleSaveNotes} 
          />
        )}
      </div>
    </div>
  );
}
