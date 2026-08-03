"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { ClipboardCheck, Search, Filter, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ObservationListPage({ params }: { params: Promise<{ segment: string }> }) {
  const { segment } = use(params);
  
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "FILLED" | "EMPTY">("ALL");

  useEffect(() => {
    fetchTokens();
  }, [segment]);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/get-tokens");
      const data = await res.json();
      
      if (!data.success) throw new Error(data.error);

      // Filter by segment
      let purposeFilter = "";
      if (segment === "child") purposeFilter = "KEMATANGAN";
      else if (segment === "student") purposeFilter = "PENJURUSAN";
      else if (segment === "employee") purposeFilter = "REKRUTMEN";

      let filteredTokens = data.tokens;
      if (purposeFilter) {
        filteredTokens = filteredTokens.filter((t: any) => t.purpose === purposeFilter);
      }

      setTokens(filteredTokens);
    } catch (error) {
      console.error("Gagal mengambil data klien:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = tokens.filter(t => {
    const name = t.clients?.name?.toLowerCase() || "";
    const code = t.token_code.toLowerCase();
    const search = searchTerm.toLowerCase();
    
    if (search && !name.includes(search) && !code.includes(search)) return false;
    
    // Check if observations exists based on observations array length or id
    const hasObservation = t.observations && (Array.isArray(t.observations) ? t.observations.length > 0 : !!t.observations.id);

    if (statusFilter === "FILLED" && !hasObservation) return false;
    if (statusFilter === "EMPTY" && hasObservation) return false;

    return true;
  });

  const title = segment === "child" ? "Kesiapan SD (Anak)" : segment === "student" ? "Penjurusan (Remaja)" : "Rekrutmen (Pegawai)";

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3 drop-shadow-md">
            <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <ClipboardCheck className="w-6 h-6 text-blue-400" />
            </div>
            Observasi & Wawancara
          </h1>
          <p className="text-slate-400 mt-2 text-lg">Daftar form observasi psikolog untuk kategori: <span className="font-semibold text-white">{title}</span></p>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-white/5 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari nama atau kode token..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:bg-white/10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-colors placeholder-slate-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-white/5 border border-white/10 text-slate-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white/10 outline-none transition-colors"
            >
              <option value="ALL" className="bg-slate-900">Semua Status</option>
              <option value="EMPTY" className="bg-slate-900">Belum Diisi</option>
              <option value="FILLED" className="bg-slate-900">Sudah Diisi</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-slate-400 font-semibold border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Kode Token</th>
                <th className="px-6 py-4">Nama Peserta</th>
                <th className="px-6 py-4">Tanggal Tes</th>
                <th className="px-6 py-4">Status Observasi</th>
                <th className="px-6 py-4">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Memuat data klien...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Tidak ada klien yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              ) : (
                filteredData.map((t) => {
                  const hasObservation = t.observations && (Array.isArray(t.observations) ? t.observations.length > 0 : !!t.observations.id);
                  
                  return (
                    <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-slate-300 bg-white/10 border border-white/10 px-2 py-1 rounded-md">
                          {t.token_code}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {t.clients?.name || <span className="text-slate-500 italic">Belum Mengisi Biodata</span>}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(t.created_at).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-6 py-4">
                        {hasObservation ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Sudah Diisi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                            <AlertCircle className="w-3.5 h-3.5" /> Belum Diisi
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Link 
                          href={`/admin/observation/${segment}/${t.id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/40 text-blue-400 rounded-lg text-xs font-bold transition-colors shadow-[0_0_10px_rgba(59,130,246,0.2)] backdrop-blur-sm"
                        >
                          {hasObservation ? "Lihat / Edit" : "Isi Observasi"}
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
