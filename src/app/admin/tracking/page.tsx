"use client";

import { useState, useEffect } from "react";

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
      const res = await fetch('/api/admin/tracking');
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      const { childTokens, parentTokens } = data;

      // Gabungkan data
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
    if (status === 'COMPLETED') return <span className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-md text-xs font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]">Selesai</span>;
    if (status === 'IN_PROGRESS') return <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-md text-xs font-bold shadow-[0_0_10px_rgba(59,130,246,0.2)]">Sedang Mengerjakan</span>;
    if (status === 'PENDING') return <span className="px-2 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-md text-xs font-bold shadow-[0_0_10px_rgba(245,158,11,0.2)]">Belum Mulai</span>;
    return <span className="px-2 py-1 bg-white/5 border border-white/10 text-slate-400 rounded-md text-xs font-bold">Belum Tersedia</span>;
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
          <h1 className="text-2xl font-bold text-white drop-shadow-md">Dasbor Tracking</h1>
          <p className="text-slate-400 text-sm mt-1">Pantau progres tes anak dan kelengkapan observasi orang tua.</p>
        </div>
        <button 
          onClick={fetchData} 
          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-lg shadow-lg backdrop-blur-md transition-colors text-sm"
        >
          🔄 Refresh Data
        </button>
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-slate-400 uppercase text-xs border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Nama Siswa</th>
                <th className="px-6 py-4">Status Anak (CPM)</th>
                <th className="px-6 py-4">Token Anak</th>
                <th className="px-6 py-4">Status Ortu (Observasi)</th>
                <th className="px-6 py-4">Token Ortu</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Memuat data...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Belum ada data peserta.</td></tr>
              ) : (
                data.map(row => (
                  <tr key={row.childTokenId} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 font-semibold text-white group-hover:text-blue-400 transition-colors">{row.studentName}</td>
                    <td className="px-6 py-4">{getStatusBadge(row.childStatus)}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{row.childToken}</td>
                    <td className="px-6 py-4">{getStatusBadge(row.parentStatus)}</td>
                    <td className="px-6 py-4 font-mono font-bold text-blue-400">{row.parentToken || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      {row.childStatus === 'COMPLETED' && row.parentStatus === 'PENDING' && row.parentToken && (
                        <button 
                          onClick={() => handleShareWa(row)}
                          className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/40 text-emerald-400 text-xs font-bold rounded-lg transition-colors shadow-[0_0_10px_rgba(16,185,129,0.2)]"
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
