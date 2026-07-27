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
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <ClipboardCheck className="w-8 h-8 text-teal-600" />
            Observasi & Wawancara
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Daftar form observasi psikolog untuk kategori: <span className="font-semibold text-slate-700">{title}</span></p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari nama atau kode token..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="EMPTY">Belum Diisi</option>
              <option value="FILLED">Sudah Diisi</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Kode Token</th>
                <th className="px-6 py-4">Nama Peserta</th>
                <th className="px-6 py-4">Tanggal Tes</th>
                <th className="px-6 py-4">Status Observasi</th>
                <th className="px-6 py-4">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
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
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                          {t.token_code}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {t.clients?.name || <span className="text-slate-400 italic">Belum Mengisi Biodata</span>}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(t.created_at).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-6 py-4">
                        {hasObservation ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Sudah Diisi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                            <AlertCircle className="w-3.5 h-3.5" /> Belum Diisi
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Link 
                          href={`/admin/observation/${segment}/${t.id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-teal-300 hover:bg-teal-50 text-teal-700 rounded-lg text-xs font-bold transition-colors"
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
