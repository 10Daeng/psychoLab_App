"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  FileBarChart2, Search, Eye, RefreshCw, ClipboardCheck, 
  Grid, List, Filter, CheckCircle2, Clock, Users, Building, Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import RecruitmentObservationModal from "@/components/admin/RecruitmentObservationModal";
import ObservationModal from "@/components/admin/ObservationModal";

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
  
  // Filters & Views
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [institutionFilter, setInstitutionFilter] = useState<string>("ALL");
  
  const [obsToken, setObsToken] = useState<any>(null);
  const [obsModalOpen, setObsModalOpen] = useState(false);

  const fetchReports = async (purpose: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?purpose=${purpose}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTokens(data.childTokens || []);
      
      // Reset filters when switching categories
      setStatusFilter("ALL");
      setInstitutionFilter("ALL");
      setSearch("");
    } catch (err: any) {
      console.error("[Reports] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(selectedPurpose);
  }, [selectedPurpose]);

  // Derivations
  const uniqueInstitutions = useMemo(() => {
    return Array.from(new Set(tokens.map(t => t.clients?.school_or_institution).filter(Boolean)));
  }, [tokens]);

  const stats = useMemo(() => {
    return {
      total: tokens.length,
      completed: tokens.filter(t => t.status === "COMPLETED").length,
      inProgress: tokens.filter(t => t.status === "IN_PROGRESS").length,
      pending: tokens.filter(t => t.status === "PENDING").length,
    };
  }, [tokens]);

  const filtered = useMemo(() => {
    return tokens.filter((t) => {
      const nameMatch = (t.clients?.name || "").toLowerCase().includes(search.toLowerCase());
      const codeMatch = (t.token_code || "").toLowerCase().includes(search.toLowerCase());
      
      const matchSearch = search === "" || nameMatch || codeMatch;
      const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
      const matchInst = institutionFilter === "ALL" || t.clients?.school_or_institution === institutionFilter;
      
      return matchSearch && matchStatus && matchInst;
    });
  }, [tokens, search, statusFilter, institutionFilter]);

  // Export ke Excel
  const handleExportExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const dataToExport = filtered.map((t, index) => ({
        "No": index + 1,
        "Nama Peserta": t.clients?.name || "Anonim",
        "Token": t.token_code,
        "Institusi": t.clients?.school_or_institution || "-",
        "Email / Telp": `${t.clients?.email || "-"} / ${t.clients?.phone || "-"}`,
        "Usia": t.clients?.age || "-",
        "Pekerjaan": t.clients?.occupation || "-",
        "Kategori Tes": selectedPurpose === "CHILD" ? "Anak" : selectedPurpose === "STU" ? "Remaja" : "Karyawan",
        "Status": t.status === "COMPLETED" ? "Selesai" : t.status === "IN_PROGRESS" ? "Sedang Ujian" : "Menunggu",
        "Tanggal Submit": new Date(t.created_at).toLocaleDateString("id-ID", {
          day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
        })
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Peserta");
      XLSX.writeFile(workbook, `Rekap_Laporan_${selectedPurpose}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error("Gagal export excel:", err);
      alert("Gagal mengunduh file Excel. Pastikan modul terinstall.");
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header & Purpose Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3 drop-shadow-md">
            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
              <FileBarChart2 className="text-indigo-400 w-6 h-6" />
            </div>
            Laporan &amp; Sertifikat
          </h1>
          <p className="text-slate-400 mt-2">
            Lihat, kelola, dan unduh laporan hasil asesmen peserta.
          </p>
        </div>
        
        {/* Purpose Tabs & Global Actions */}
        <div className="flex flex-col md:flex-row gap-3 items-end">
          <div className="flex flex-wrap gap-2 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-md shrink-0">
            {PURPOSE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedPurpose(opt.value)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  selectedPurpose === opt.value
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                    : "text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                {opt.emoji} {opt.label}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                window.location.href = `/api/admin/reports/bulk-download?purpose=${selectedPurpose}&institution=${institutionFilter}`;
              }}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-900/50"
              title="Unduh Semua Data Mentah JSON"
            >
              <Download size={16} /> Raw JSON
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-900/50"
              title="Unduh Rekap Peserta ke Excel"
            >
              <FileBarChart2 size={16} /> Rekap Excel
            </button>
          </div>
        </div>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex items-center gap-4 hover:bg-white/10 transition-colors shadow-lg">
            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-2xl">
               <Users className="w-6 h-6" />
            </div>
            <div>
               <p className="text-sm text-slate-400 font-medium">Total Peserta</p>
               <h3 className="text-2xl font-bold text-white">{stats.total}</h3>
            </div>
         </div>
         <div className="bg-white/5 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-5 flex items-center gap-4 hover:bg-white/10 transition-colors shadow-lg">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl">
               <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
               <p className="text-sm text-slate-400 font-medium">Selesai</p>
               <h3 className="text-2xl font-bold text-emerald-400">{stats.completed}</h3>
            </div>
         </div>
         <div className="bg-white/5 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-5 flex items-center gap-4 hover:bg-white/10 transition-colors shadow-lg">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl">
               <Clock className="w-6 h-6" />
            </div>
            <div>
               <p className="text-sm text-slate-400 font-medium">Sedang Berjalan</p>
               <h3 className="text-2xl font-bold text-amber-400">{stats.inProgress}</h3>
            </div>
         </div>
         <div className="bg-white/5 backdrop-blur-xl border border-slate-500/20 rounded-3xl p-5 flex items-center gap-4 hover:bg-white/10 transition-colors shadow-lg">
            <div className="p-3 bg-slate-500/20 text-slate-400 rounded-2xl">
               <Filter className="w-6 h-6" />
            </div>
            <div>
               <p className="text-sm text-slate-400 font-medium">Menunggu</p>
               <h3 className="text-2xl font-bold text-slate-300">{stats.pending}</h3>
            </div>
         </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        {/* Dekorasi Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        {/* Advanced Tools Bar */}
        <div className="flex flex-col lg:flex-row justify-between mb-8 gap-4 lg:gap-6 relative z-10">
          {/* Search & Filters */}
          <div className="flex-1 flex flex-wrap gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari nama atau token..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition placeholder-slate-500"
              />
            </div>
            
            <div className="relative">
               <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-slate-900/50 border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition cursor-pointer"
               >
                 <option value="ALL">Semua Status</option>
                 <option value="COMPLETED">Selesai</option>
                 <option value="IN_PROGRESS">Sedang Ujian</option>
                 <option value="PENDING">Menunggu</option>
               </select>
               <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {uniqueInstitutions.length > 0 && (
               <div className="relative">
                  <select 
                     value={institutionFilter}
                     onChange={(e) => setInstitutionFilter(e.target.value)}
                     className="appearance-none bg-slate-900/50 border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition cursor-pointer max-w-[200px] truncate"
                  >
                    <option value="ALL">Semua Institusi</option>
                    {uniqueInstitutions.map((inst: any) => (
                      <option key={inst} value={inst}>{inst}</option>
                    ))}
                  </select>
                  <Building className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
               </div>
            )}
          </div>
          
          {/* Actions & View Toggles */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => fetchReports(selectedPurpose)}
              className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-700/50 border border-white/10 text-slate-300 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
              title="Segarkan Data"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>

            <div className="flex bg-slate-900/50 rounded-xl border border-white/10 p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                title="Tampilan Kartu"
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                title="Tampilan Tabel"
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="min-h-[400px] relative z-10">
           {loading ? (
             <div className="flex flex-col items-center justify-center h-64 text-slate-500">
               <RefreshCw className="w-8 h-8 animate-spin mb-4 text-indigo-400" />
               <p>Memuat data analitik...</p>
             </div>
           ) : filtered.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-slate-500 border-2 border-dashed border-white/10 rounded-2xl bg-slate-900/20">
               <FileBarChart2 className="w-12 h-12 mb-4 opacity-20" />
               <p className="font-medium text-slate-400">Tidak ada laporan yang sesuai dengan kriteria.</p>
               <p className="text-sm mt-1">Coba sesuaikan kata kunci atau filter pencarian.</p>
             </div>
           ) : viewMode === "table" ? (
             <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-900/40">
               <table className="w-full text-left border-collapse">
                 <thead className="bg-slate-800/80 border-b border-white/10">
                   <tr className="text-slate-400 text-sm">
                     <th className="py-4 px-5 font-semibold">Nama Peserta</th>
                     <th className="py-4 px-5 font-semibold">Token</th>
                     <th className="py-4 px-5 font-semibold">Institusi</th>
                     <th className="py-4 px-5 font-semibold">Status</th>
                     <th className="py-4 px-5 font-semibold text-right">Aksi</th>
                   </tr>
                 </thead>
                 <tbody className="text-sm divide-y divide-white/5">
                   {filtered.map((token) => (
                     <motion.tr
                       key={token.id}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="hover:bg-white/5 transition-colors group"
                     >
                       <td className="py-4 px-5">
                         <div className="font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors text-base">
                           {token.clients?.name || "—"}
                         </div>
                         {token.clients?.school_or_institution && (
                           <div className="text-[12px] text-slate-500 mt-1 flex items-center gap-1">
                             <Building size={10} /> {token.clients.school_or_institution}
                           </div>
                         )}
                       </td>
                       <td className="py-4 px-5">
                         <span className="text-[11px] font-mono bg-slate-950/80 px-2.5 py-1 rounded-md text-slate-300 border border-white/10 shadow-inner">
                           {token.token_code}
                         </span>
                       </td>
                       <td className="py-4 px-5 text-slate-400">
                         {token.clients?.school_or_institution || "—"}
                       </td>
                       <td className="py-4 px-5">
                         <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_BADGE[token.status] || STATUS_BADGE.PENDING}`}>
                           {token.status === "COMPLETED" ? "Selesai" : token.status === "IN_PROGRESS" ? "Sedang Ujian" : "Menunggu"}
                         </span>
                       </td>
                       <td className="py-4 px-5 text-right">
                         <div className="flex items-center justify-end gap-2 flex-wrap">
                           {selectedPurpose === "EMP" && (
                             <div className="flex gap-1.5">
                               <button
                                 onClick={() => { setObsToken(token); setObsModalOpen(true); }}
                                 className="px-2.5 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-400 font-medium rounded-lg transition-all active:scale-95 text-xs flex items-center gap-1.5"
                                 title="Observasi"
                               >
                                 <ClipboardCheck size={14} />
                               </button>
                               <button
                                 onClick={() => router.push(`/admin/reports/${token.id}/graphology`)}
                                 className="px-2.5 py-1.5 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-slate-300 font-medium rounded-lg transition-all active:scale-95 text-xs flex items-center gap-1.5"
                                 title="Input Grafologi"
                               >
                                 ✍️
                               </button>
                               <button
                                 onClick={() => router.push(`/admin/reports/${token.id}/wartegg`)}
                                 className="px-2.5 py-1.5 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-slate-300 font-medium rounded-lg transition-all active:scale-95 text-xs flex items-center gap-1.5"
                                 title="Input Wartegg"
                               >
                                 ⬛
                               </button>
                             </div>
                           )}
                           <button
                             onClick={() => router.push(`/admin/reports/${token.id}`)}
                             className={`px-4 py-2 font-bold rounded-xl transition-all active:scale-95 text-xs flex items-center gap-1.5 shadow-lg ${
                               token.status === "COMPLETED" 
                               ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/50" 
                               : "bg-slate-700 hover:bg-slate-600 text-slate-200"
                             }`}
                           >
                             <Eye size={14} /> {token.status === "COMPLETED" ? "Lihat Hasil" : "Lihat Laporan"}
                           </button>
                         </div>
                       </td>
                     </motion.tr>
                   ))}
                 </tbody>
               </table>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
               <AnimatePresence>
                 {filtered.map((token, idx) => (
                   <motion.div
                     layout
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.9 }}
                     transition={{ delay: idx * 0.05 }}
                     key={token.id}
                     className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col hover:bg-slate-800/60 hover:border-indigo-500/50 transition-all shadow-xl group hover:shadow-indigo-500/10 hover:-translate-y-1"
                   >
                     <div className="flex justify-between items-start mb-4">
                       <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${STATUS_BADGE[token.status] || STATUS_BADGE.PENDING}`}>
                         {token.status === "COMPLETED" ? "Selesai" : token.status === "IN_PROGRESS" ? "Sedang Ujian" : "Menunggu"}
                       </span>
                       <span className="text-[10px] font-mono bg-slate-950/80 px-2 py-1 rounded-md text-slate-400 border border-white/10 shadow-inner">
                         {token.token_code}
                       </span>
                     </div>
                     
                     <div className="flex-1 mb-6">
                       <h3 className="font-bold text-lg text-slate-200 group-hover:text-indigo-400 transition-colors line-clamp-1" title={token.clients?.name}>
                         {token.clients?.name || "Anonim"}
                       </h3>
                       {token.clients?.school_or_institution && (
                         <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
                           <Building size={12} className="shrink-0" /> 
                           <span className="truncate">{token.clients.school_or_institution}</span>
                         </div>
                       )}
                       <div className="text-[11px] text-slate-600 mt-2 flex items-center gap-1.5 font-medium">
                         <Clock size={12} className="shrink-0" />
                         {new Date(token.created_at).toLocaleDateString("id-ID", {
                           day: "numeric", month: "short", year: "numeric", hour: '2-digit', minute:'2-digit'
                         })}
                       </div>
                     </div>
                     
                     <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-2 mt-auto">
                        {selectedPurpose === "EMP" ? (
                          <div className="flex gap-1.5 flex-1">
                            <button
                              onClick={() => { setObsToken(token); setObsModalOpen(true); }}
                              className="flex-1 py-2 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-400 font-medium rounded-xl transition-all active:scale-95 text-[10px] flex items-center justify-center gap-1"
                              title="Observasi"
                            >
                              <ClipboardCheck size={14} /> Obs.
                            </button>
                            <button
                              onClick={() => router.push(`/admin/reports/${token.id}/graphology`)}
                              className="flex-1 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-slate-300 font-medium rounded-xl transition-all active:scale-95 text-[10px] flex items-center justify-center gap-1"
                              title="Input Grafologi"
                            >
                              ✍️ Graf.
                            </button>
                            <button
                              onClick={() => router.push(`/admin/reports/${token.id}/wartegg`)}
                              className="flex-1 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-slate-300 font-medium rounded-xl transition-all active:scale-95 text-[10px] flex items-center justify-center gap-1"
                              title="Input Wartegg"
                            >
                              ⬛ War.
                            </button>
                          </div>
                        ) : <div className="flex-1 hidden md:block"></div>}
                        
                        <button
                          onClick={() => router.push(`/admin/reports/${token.id}`)}
                          className={`flex-1 py-2 font-bold rounded-xl transition-all active:scale-95 text-[11px] flex items-center justify-center gap-1.5 shadow-lg ${
                            token.status === "COMPLETED" 
                            ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/50" 
                            : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                          }`}
                        >
                          <Eye size={14} /> {token.status === "COMPLETED" ? "Hasil" : "Laporan"}
                        </button>
                      </div>
                   </motion.div>
                 ))}
               </AnimatePresence>
             </div>
           )}
        </div>

        {!loading && filtered.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/10 text-right relative z-10">
            <p className="text-sm text-slate-500 font-medium bg-slate-900/50 inline-block px-4 py-2 rounded-xl border border-white/5">
              Menampilkan <strong className="text-white">{filtered.length}</strong> dari <strong className="text-slate-300">{tokens.length}</strong> laporan
            </p>
          </div>
        )}
      </div>

      {/* Modal Observasi (Dinamis sesuai Purpose) */}
      {obsToken && selectedPurpose === "EMP" && (
        <RecruitmentObservationModal
          isOpen={obsModalOpen}
          onClose={() => { setObsModalOpen(false); setObsToken(null); }}
          tokenId={obsToken.id}
          clientName={obsToken.clients?.name || "Kandidat"}
          tokenCode={obsToken.token_code}
          onSuccess={() => fetchReports(selectedPurpose)}
        />
      )}

      {obsToken && selectedPurpose !== "EMP" && (
        <ObservationModal
          isOpen={obsModalOpen}
          onClose={() => { setObsModalOpen(false); setObsToken(null); }}
          tokenId={obsToken.id}
          clientName={obsToken.clients?.name || "Klien"}
          tokenCode={obsToken.token_code}
          onSuccess={() => fetchReports(selectedPurpose)}
        />
      )}
    </div>
  );
}
