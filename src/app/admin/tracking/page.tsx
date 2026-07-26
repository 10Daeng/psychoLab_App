"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type TrackingRow = {
  childTokenId: string;
  studentName: string;
  childToken: string;
  childStatus: string;
  parentToken: string | null;
  parentStatus: string;
};

export default function TrackingDashboard() {
  const [data, setData] = useState<TrackingRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Ambil data token anak (SELF)
      const { data: childTokens, error: err1 } = await supabase
        .from("tokens")
        .select("id, token_code, status, clients(name)")
        .eq("respondent_type", "SELF")
        .eq("purpose", "CHILD")
        .order("created_at", { ascending: false });

      if (err1) throw err1;

      // 2. Ambil data token orang tua (PARENT)
      const { data: parentTokens, error: err2 } = await supabase
        .from("tokens")
        .select("id, token_code, status, parent_token_id")
        .eq("respondent_type", "PARENT")
        .eq("purpose", "CHILD");

      if (err2) throw err2;

      // 3. Gabungkan data
      if (childTokens) {
        const merged: TrackingRow[] = childTokens.map((ct: any) => {
          const pt = parentTokens?.find((p: any) => p.parent_token_id === ct.id);
          return {
            childTokenId: ct.id,
            studentName: ct.clients?.name || "Belum Mengisi Biodata",
            childToken: ct.token_code,
            childStatus: ct.status,
            parentToken: pt?.token_code || null,
            parentStatus: pt?.status || "NOT_GENERATED"
          };
        });
        setData(merged);
      }
    } catch (err: any) {
      console.error(err);
      alert("Gagal memuat data tracking.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    if (status === 'COMPLETED') return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-bold">Selesai</span>;
    if (status === 'IN_PROGRESS') return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-bold">Sedang Mengerjakan</span>;
    if (status === 'PENDING') return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md text-xs font-bold">Belum Mulai</span>;
    return <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded-md text-xs font-bold">Belum Tersedia</span>;
  };

  const handleShareWa = (row: TrackingRow) => {
    if (!row.parentToken) return;
    const appUrl = window.location.origin;
    const text = `Halo Bapak/Ibu, ananda *${row.studentName}* telah menyelesaikan Tes CPM.\n\nMohon segera melengkapi Kuesioner Observasi Orang Tua di ${appUrl} dengan memasukkan Kode Token:\n*${row.parentToken}*\n\nTerima kasih atas kerja samanya!`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dasbor Tracking</h1>
          <p className="text-slate-500 text-sm mt-1">Pantau progres tes anak dan kelengkapan observasi orang tua.</p>
        </div>
        <button 
          onClick={fetchData} 
          className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg shadow-sm transition-colors text-sm"
        >
          🔄 Refresh Data
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Nama Siswa</th>
                <th className="px-6 py-4">Status Anak (CPM)</th>
                <th className="px-6 py-4">Token Anak</th>
                <th className="px-6 py-4">Status Ortu (Observasi)</th>
                <th className="px-6 py-4">Token Ortu</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Memuat data...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Belum ada data peserta.</td></tr>
              ) : (
                data.map(row => (
                  <tr key={row.childTokenId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800">{row.studentName}</td>
                    <td className="px-6 py-4">{getStatusBadge(row.childStatus)}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{row.childToken}</td>
                    <td className="px-6 py-4">{getStatusBadge(row.parentStatus)}</td>
                    <td className="px-6 py-4 font-mono font-bold text-blue-600">{row.parentToken || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      {row.childStatus === 'COMPLETED' && row.parentStatus === 'PENDING' && row.parentToken && (
                        <button 
                          onClick={() => handleShareWa(row)}
                          className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                        >
                          Tegur via WA
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
