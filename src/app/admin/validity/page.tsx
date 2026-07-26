"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { calculateValidityIndex } from '@/lib/validity_engine';
import { ArrowDown, ArrowUp, Download, Eye, FileEdit, Trash2, ArrowUpDown, ShieldAlert } from 'lucide-react';
import * as XLSX from 'xlsx';

function SortIcon({ sortBy, sortDir, field }: any) {
  if (sortBy !== field) return <ArrowUpDown className="w-3 h-3 text-slate-600 inline ml-1" />;
  return sortDir === 'asc' 
    ? <ArrowUp className="w-3 h-3 text-blue-400 inline ml-1" />
    : <ArrowDown className="w-3 h-3 text-blue-400 inline ml-1" />;
}

const getScoreColor = (score: any) => {
  if (score < 0 || score === '-') return 'text-slate-500';
  if (score >= 85) return 'text-emerald-400';
  if (score >= 70) return 'text-yellow-400';
  if (score >= 50) return 'text-orange-400';
  return 'text-red-400';
};

const getScoreBg = (score: any) => {
  if (score < 0 || score === '-') return 'bg-slate-500/10 border-slate-700/50';
  if (score >= 85) return 'bg-emerald-500/10 border-emerald-500/20';
  if (score >= 70) return 'bg-yellow-500/10 border-yellow-500/20';
  if (score >= 50) return 'bg-orange-500/10 border-orange-500/20';
  return 'bg-red-500/10 border-red-500/20';
};

export default function ValidityPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('semua');
  const [sortBy, setSortBy] = useState('submittedAt');
  const [sortDir, setSortDir] = useState('desc');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetch('/api/admin/validity');
      const json = await res.json();
      if (json.success) setData(json.data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  function toggleSort(field: string) {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/delete-token`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setData(prev => prev.filter(d => d.id !== id));
        setDeleteConfirm(null);
      }
    } catch (e) {
      console.error(e);
    }
  }

  const enriched = useMemo(() => {
    return data.map(sub => {
      // Jika SDS, ambil dari backend (sdsValidity)
      // Jika CPM/HEXACO, hitung lewat calculateValidityIndex
      let val: any = null;
      if (sub.testCodes.includes('SDS')) {
        // Mock SDS validity formatting to match our component structure
        val = {
           overallScore: sub.sdsValidity ? (sub.sdsValidity.status === 'not_interpretable' ? 40 : sub.sdsValidity.status === 'interpretable_with_caution' ? 65 : 90) : '-',
           overallLabel: sub.sdsValidity ? (sub.sdsValidity.status === 'not_interpretable' ? 'TIDAK VALID' : sub.sdsValidity.status === 'interpretable_with_caution' ? 'MERAGUKAN' : 'VALID') : 'N/A',
           indicators: {
             duration: { score: -1, label: 'N/A' },
             straightLining: { score: -1, label: 'N/A' },
             extreme: { score: -1, label: 'N/A' },
             inconsistency: { score: -1, label: 'N/A' },
           }
        };
      } else {
        val = calculateValidityIndex(sub.rawData, sub.testCodes);
      }
      return { ...sub, _validity: val };
    });
  }, [data]);

  const sorted = useMemo(() => {
    let list = [...enriched];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s => {
        const ud = s.userData || {};
        return (ud.nama || '').toLowerCase().includes(q) || (ud.email || '').toLowerCase().includes(q) || (s.tokenCode || '').toLowerCase().includes(q);
      });
    }

    if (filterStatus !== 'semua') {
      list = list.filter(s => {
        const score = s._validity.overallScore;
        if (score === '-') return filterStatus === 'na';
        if (filterStatus === 'valid') return score >= 85;
        if (filterStatus === 'cukup') return score >= 70 && score < 85;
        if (filterStatus === 'ragu') return score >= 50 && score < 70;
        if (filterStatus === 'invalid') return score < 50;
        return true;
      });
    }

    list.sort((a, b) => {
      let va, vb;
      switch (sortBy) {
        case 'nama':
          va = (a.userData?.nama || '').toLowerCase();
          vb = (b.userData?.nama || '').toLowerCase();
          break;
        case 'overall':
          va = typeof a._validity.overallScore === 'number' ? a._validity.overallScore : -1;
          vb = typeof b._validity.overallScore === 'number' ? b._validity.overallScore : -1;
          break;
        case 'durasi':
          va = a._validity.indicators?.duration?.score || -1;
          vb = b._validity.indicators?.duration?.score || -1;
          break;
        case 'straightLining':
          va = a._validity.indicators?.straightLining?.score || -1;
          vb = b._validity.indicators?.straightLining?.score || -1;
          break;
        case 'submittedAt':
        default:
          va = a.submittedAt || '';
          vb = b.submittedAt || '';
          break;
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [enriched, search, filterStatus, sortBy, sortDir]);

  const stats = useMemo(() => {
    const total = enriched.length;
    let valid = 0, cukup = 0, ragu = 0, invalid = 0, na = 0;
    enriched.forEach(s => {
      const sc = s._validity.overallScore;
      if (sc === '-') na++;
      else if (sc >= 85) valid++;
      else if (sc >= 70) cukup++;
      else if (sc >= 50) ragu++;
      else invalid++;
    });
    return { total, valid, cukup, ragu, invalid, na };
  }, [enriched]);

  const downloadExcel = () => {
    if (sorted.length === 0) return;
    const exportData = sorted.map((sub, i) => {
      const v = sub._validity;
      const ind = v.indicators;
      return {
        "No": i + 1,
        "Token": sub.tokenCode,
        "Nama": sub.userData?.nama || '-',
        "Instansi": sub.userData?.instansi || '-',
        "Tanggal Selesai": sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('id-ID') : '-',
        "Skor Validitas": v.overallScore,
        "Status Validitas": v.overallLabel,
        "Indikator Durasi": ind?.duration?.score >= 0 ? `${ind.duration.score} (${ind.duration.label})` : '-',
        "Indikator Pola (Straight-Lining)": ind?.straightLining?.score >= 0 ? `${ind.straightLining.score} (${ind.straightLining.label})` : '-',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Validitas");
    XLSX.writeFile(workbook, `Analisis_Validitas_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const ScoreCell = ({ score, label }: any) => (
    <td className="px-3 py-3 align-middle text-center">
      <div className={`inline-flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl border \${getScoreBg(score)} min-w-[60px]`}>
        <span className={`font-mono font-bold text-sm leading-none \${getScoreColor(score)}`}>
          {score >= 0 ? score : '-'}
        </span>
        <span className={`text-[9px] uppercase tracking-wider font-bold \${getScoreColor(score)} opacity-80 mt-0.5 leading-none`}>
          {label}
        </span>
      </div>
    </td>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span className="text-blue-500">🛡️</span> Analisis Validitas
          </h1>
          <p className="text-slate-400 text-sm mt-2 max-w-xl">
            Sistem pendeteksi kecurangan dan keandalan respons klien. Menganalisis kecepatan pengerjaan dan pola pengisian asal-asalan.
          </p>
        </div>
        <button 
          onClick={downloadExcel} 
          className="bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-slate-600 text-slate-200 font-bold py-2.5 px-5 rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg"
        >
          <Download className="w-4 h-4 text-emerald-400" /> Download Excel
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: 'Total Selesai', value: stats.total, color: 'text-white', bg: 'bg-slate-800/80 border-slate-700' },
          { label: 'Valid', value: stats.valid, color: 'text-emerald-400', bg: 'bg-emerald-900/20 border-emerald-500/20' },
          { label: 'Cukup', value: stats.cukup, color: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-500/20' },
          { label: 'Meragukan', value: stats.ragu, color: 'text-orange-400', bg: 'bg-orange-900/20 border-orange-500/20' },
          { label: 'Tidak Valid', value: stats.invalid, color: 'text-red-400', bg: 'bg-red-900/20 border-red-500/20' },
          { label: 'Belum Dihitung', value: stats.na, color: 'text-slate-500', bg: 'bg-slate-900/50 border-slate-800' },
        ].map(s => (
          <div key={s.label} className={`border rounded-2xl p-4 text-center backdrop-blur-xl \${s.bg} shadow-lg`}>
            <div className={`text-3xl font-black \${s.color} mb-1`}>{s.value}</div>
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center">
        <input
          type="text" placeholder="Cari nama, token, instansi..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none placeholder:text-slate-600 transition-all"
        />
        <select
          value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="w-full md:w-auto bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl text-sm focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
        >
          <option value="semua">Semua Kategori</option>
          <option value="valid">✅ Valid (≥ 85)</option>
          <option value="cukup">⚠️ Cukup Valid (70 - 84)</option>
          <option value="ragu">🟠 Meragukan (50 - 69)</option>
          <option value="invalid">❌ Tidak Valid (&lt; 50)</option>
          <option value="na">⬜ Belum Dihitung</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-950/50 text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-800">
                <th className="px-5 py-4 font-bold">Peserta</th>
                <th className="px-5 py-4 font-bold cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('submittedAt')}>
                  Selesai Pada <SortIcon sortBy={sortBy} sortDir={sortDir} field="submittedAt" />
                </th>
                <th className="px-3 py-4 font-bold text-center cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('overall')}>
                  Total Validitas <SortIcon sortBy={sortBy} sortDir={sortDir} field="overall" />
                </th>
                <th className="px-3 py-4 font-bold text-center cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('durasi')}>
                  Skor Durasi <SortIcon sortBy={sortBy} sortDir={sortDir} field="durasi" />
                </th>
                <th className="px-3 py-4 font-bold text-center cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('straightLining')}>
                  Pola Lurus <SortIcon sortBy={sortBy} sortDir={sortDir} field="straightLining" />
                </th>
                <th className="px-5 py-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {sorted.map((sub) => {
                const ud = sub.userData || {};
                const v = sub._validity;
                const ind = v.indicators || {};

                return (
                  <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-5 py-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-slate-300 font-bold text-xs shrink-0">
                          {ud.nama ? ud.nama.substring(0, 2).toUpperCase() : 'AN'}
                        </div>
                        <div>
                          <div className="text-white font-bold text-sm">{ud.nama || 'Anonim'}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase">{sub.tokenCode}</span>
                            <span className="text-xs text-slate-500">{ud.instansi}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-middle whitespace-nowrap">
                      <div className="text-slate-300 text-xs font-medium">
                        {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </div>
                      <div className="text-slate-500 text-[10px] mt-0.5 font-mono">
                        {sub.submittedAt ? new Date(sub.submittedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : ''}
                      </div>
                    </td>
                    
                    <ScoreCell score={v.overallScore === '-' ? -1 : v.overallScore} label={v.overallLabel} />
                    <ScoreCell score={ind.duration?.score} label={ind.duration?.label || 'N/A'} />
                    <ScoreCell score={ind.straightLining?.score} label={ind.straightLining?.label || 'N/A'} />
                    
                    <td className="px-5 py-4 align-middle text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/admin/reports/${sub.id}`} className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors" title="Lihat Laporan">
                          <Eye className="w-4 h-4" />
                        </Link>
                        {deleteConfirm === sub.id ? (
                          <div className="flex items-center gap-1 bg-red-500/10 rounded-lg p-1">
                            <button onClick={() => handleDelete(sub.id)} className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold rounded-md transition-colors">YA, HAPUS</button>
                            <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-slate-400 hover:text-slate-200 text-[10px] font-bold transition-colors">BATAL</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm(sub.id)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors" title="Hapus Data">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShieldAlert className="w-8 h-8 text-slate-600" />
                    </div>
                    <p className="text-slate-400 text-sm">Tidak ada data yang cocok dengan kriteria filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-lg">
        <h4 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
           <span className="text-blue-500">📖</span> Keterangan Indikator Validitas
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/50">
            <span className="text-blue-400 font-bold text-sm block mb-1">Durasi Pengerjaan</span> 
            <p className="text-slate-400 leading-relaxed">Mendeteksi jika peserta menyelesaikan tes jauh di bawah standar waktu normal (Kurang dari 4-5 menit). Semakin rendah skor, semakin cepat/asal mereka mengisi.</p>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/50">
            <span className="text-blue-400 font-bold text-sm block mb-1">Pola Lurus (Straight-Lining)</span> 
            <p className="text-slate-400 leading-relaxed">Mendeteksi jika peserta menjawab dengan pola yang monoton secara berurutan (misal: A terus-menerus, atau B terus-menerus sebanyak &gt;10 kali).</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-5 pt-5 border-t border-slate-800/50 font-bold">
          <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-[11px]">● ≥ 85 : Valid</span>
          <span className="bg-yellow-500/10 text-yellow-400 px-3 py-1.5 rounded-lg border border-yellow-500/20 text-[11px]">● 70 - 84 : Cukup Valid</span>
          <span className="bg-orange-500/10 text-orange-400 px-3 py-1.5 rounded-lg border border-orange-500/20 text-[11px]">● 50 - 69 : Meragukan</span>
          <span className="bg-red-500/10 text-red-400 px-3 py-1.5 rounded-lg border border-red-500/20 text-[11px]">● &lt; 50 : Tidak Valid</span>
        </div>
      </div>
    </div>
  );
}
