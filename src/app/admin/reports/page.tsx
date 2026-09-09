"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileBarChart2, Search, Download, Eye, RefreshCw, Filter, FileJson } from "lucide-react";
import { motion } from "framer-motion";

const PURPOSE_OPTIONS = [
  { value: "CHILD", label: "Asesmen Anak", color: "blue", emoji: "👶" },
  { value: "STU", label: "Penjurusan Remaja", color: "emerald", emoji: "🎓" },
  { value: "EMP", label: "Rekrutmen Pegawai", color: "purple", emoji: "💼" },
];

const STATUS_BADGE: Record<string, string> = {
  COMPLETED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  IN_PROGRESS: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  PENDING: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

export default function ReportsIndexPage() {
  const router = useRouter();
  const [selectedPurpose, setSelectedPurpose] = useState("CHILD");
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchReports = async (purpose: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?purpose=${purpose}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTokens(data.childTokens || []);
    } catch (err: any) {
      console.error("[Reports] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(selectedPurpose);
  }, [selectedPurpose]);

  const filtered = tokens.filter((t) => {
    const name = t.clients?.name?.toLowerCase() || "";
    const code = t.token_code?.toLowerCase() || "";
    const q = search.toLowerCase();
    return name.includes(q) || code.includes(q);
  });

  const activePurpose = PURPOSE_OPTIONS.find((p) => p.value === selectedPurpose)!;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3 drop-shadow-md">
            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
              <FileBarChart2 className="text-indigo-400 w-6 h-6" />
            </div>
            Laporan &amp; Sertifikat
          </h1>
          <p className="text-slate-400 mt-2">
            Lihat dan unduh laporan hasil asesmen per peserta.
          </p>
        </div>
      </div>

      {/* Purpose Tabs */}
      <div className="flex flex-wrap gap-3">
        {PURPOSE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSelectedPurpose(opt.value)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border backdrop-blur-md ${
              selectedPurpose === opt.value
                ? "bg-white/15 border-white/30 text-white shadow-lg"
                : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            {opt.emoji} {opt.label}
          </button>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
        {/* Search */}
        <div className="flex justify-between mb-6 flex-wrap gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari nama atau token..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition placeholder-slate-500"
            />
          </div>
          <button
            onClick={() => fetchReports(selectedPurpose)}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 border-b border-white/10">
              <tr className="text-slate-400 text-sm">
                <th className="pb-3 px-4 font-medium">Nama Peserta</th>
                <th className="pb-3 px-4 font-medium">Token</th>
                <th className="pb-3 px-4 font-medium">Institusi</th>
                <th className="pb-3 px-4 font-medium">Status</th>
                <th className="pb-3 px-4 font-medium">Tanggal</th>
                <th className="pb-3 px-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                    Memuat data laporan...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <FileBarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    Belum ada laporan untuk kategori ini.
                  </td>
                </tr>
              ) : (
                filtered.map((token) => (
                  <motion.tr
                    key={token.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-white/5 hover:bg-white/5 transition group"
                  >
                    <td className="py-4 px-4">
                      <div className="font-medium text-white group-hover:text-indigo-400 transition-colors">
                        {token.clients?.name || "—"}
                      </div>
                      {token.clients?.school_or_institution && (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {token.clients.school_or_institution}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-[11px] font-mono bg-slate-950/50 px-2 py-0.5 rounded text-slate-300 border border-white/10">
                        {token.token_code}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-400">
                      {token.clients?.school_or_institution || "—"}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                          STATUS_BADGE[token.status] || STATUS_BADGE.PENDING
                        }`}
                      >
                        {token.status === "COMPLETED"
                          ? "Selesai"
                          : token.status === "IN_PROGRESS"
                          ? "Sedang Ujian"
                          : "Menunggu"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-400 text-xs">
                      {new Date(token.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        {token.status === "COMPLETED" ? (
                          <button
                            onClick={() => router.push(`/admin/reports/${token.id}`)}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all active:scale-95 text-[11px] flex items-center gap-1.5 shadow-md"
                          >
                            <Eye size={14} /> Lihat Hasil
                          </button>
                        ) : (
                          <button
                            onClick={() => router.push(`/admin/reports/${token.id}`)}
                            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all active:scale-95 text-[11px] flex items-center gap-1.5 shadow-md"
                          >
                            <Eye size={14} /> Lihat Laporan
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <p className="text-xs text-slate-500 mt-4 text-right">
            Menampilkan {filtered.length} dari {tokens.length} laporan
          </p>
        )}
      </div>
    </div>
  );
}
