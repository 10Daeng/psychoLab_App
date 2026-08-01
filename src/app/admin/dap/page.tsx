"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, ChevronRight, PenTool, CheckCircle2, Clock } from "lucide-react";

export default function DapIndexPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dapRecords, setDapRecords] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/dap');
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error);

        const { tokens, dapRecords } = data;
        setDapRecords(dapRecords || []);

        const merged = tokens?.filter((ct: any) => ct.token_code.startsWith("CHI-") || ct.token_code.startsWith("CPM-")).map((ct: any) => {
          const clientData = ct.clients as any;
          return {
            id: ct.id,
            name: clientData?.name || 'Anonim',
            tokenCode: ct.token_code || '',
            status: ct.status,
            createdAt: ct.created_at
          };
        });

        setData(merged || []);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch DAP records:", err);
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredData = data.filter(row => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!row.name.toLowerCase().includes(q) && !row.tokenCode.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <PenTool className="w-8 h-8 text-blue-500" />
            Penilaian Grafis (DAP)
          </h1>
          <p className="text-slate-400 mt-2 text-sm max-w-2xl leading-relaxed">
            Pilih peserta untuk menginput nilai Draw-A-Person (DAP) berdasarkan hasil gambar mereka.
          </p>
        </div>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800/80 bg-slate-900/80 flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Cari nama atau kode token..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
              Memuat data peserta...
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-800/50">
                  <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Peserta / Token</th>
                  <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Status Utama</th>
                  <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Status DAP</th>
                  <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-slate-500 font-medium">
                      Tidak ada data yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, idx) => {
                    const dap = dapRecords.find(d => d.token_id === row.id);
                    return (
                      <motion.tr 
                        key={row.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="hover:bg-slate-800/20 transition-colors group"
                      >
                        <td className="p-5">
                          <p className="text-sm font-bold text-slate-200">{row.name}</p>
                          <p className="text-xs font-mono text-slate-500 mt-1">{row.tokenCode}</p>
                        </td>
                        <td className="p-5">
                          {row.status === "COMPLETED" ? (
                             <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                               <CheckCircle2 className="w-3 h-3" /> Tes Selesai
                             </span>
                          ) : (
                             <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/20">
                               <Clock className="w-3 h-3" /> Belum Selesai
                             </span>
                          )}
                        </td>
                        <td className="p-5">
                          {dap ? (
                             <div>
                               <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                 <CheckCircle2 className="w-3 h-3" /> Sudah Dinilai
                               </span>
                               <p className="text-xs text-slate-500 mt-2 font-medium">Skor: {dap.score}/73</p>
                             </div>
                          ) : (
                             <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                               <Clock className="w-3 h-3" /> Belum Dinilai
                             </span>
                          )}
                        </td>
                        <td className="p-5 text-right">
                           <div className="flex items-center justify-end gap-2">
                             <Link href={`/admin/dap/scoring/${row.id}`} className="inline-flex items-center justify-center p-2 rounded-xl bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white transition-all group-hover:shadow-lg">
                               <PenTool className="w-4 h-4" />
                             </Link>
                             {dap && (
                               <Link href={`/admin/dap/result/${row.id}`} className="inline-flex items-center justify-center p-2 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-400 hover:text-white transition-all group-hover:shadow-lg">
                                 <ChevronRight className="w-4 h-4" />
                               </Link>
                             )}
                           </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
