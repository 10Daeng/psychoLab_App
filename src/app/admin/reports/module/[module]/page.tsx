'use client';
import { useState, useEffect, useMemo, use } from 'react';
import Link from 'next/link';

export default function ModuleRecapPage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = use(params);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/module-results?module=${module}`);
        const json = await res.json();
        if (json.data) {
          setData(json.data);
        }
      } catch (e) {
        console.error('Fetch error:', e);
      }
      setLoading(false);
    }
    fetchData();
  }, [module]);

  const sortedAndFiltered = useMemo(() => {
    let list = [...data];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(item => {
        // Handle OBSERVASI_ANAK / WAWANCARA_ANAK which return tokens + clients directly
        const client = item.clients || item.tokens?.clients || {};
        return (client.name || '').toLowerCase().includes(q) || (client.email || '').toLowerCase().includes(q);
      });
    }
    return list;
  }, [data, search]);

  const renderModuleSpecificColumns = (item: any) => {
    const score = item.calculated_score?.calculatedData || {};
    
    if (module === 'DISC') {
      return (
        <>
          <td className="px-5 py-4 font-semibold text-white">{score.archetype || '-'}</td>
          <td className="px-5 py-4">
            <div className="flex gap-2 text-xs">
              <span className="bg-red-500/10 text-red-400 px-2 py-1 rounded">D: {score.D || 0}</span>
              <span className="bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded">I: {score.I || 0}</span>
              <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded">S: {score.S || 0}</span>
              <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded">C: {score.C || 0}</span>
            </div>
          </td>
        </>
      );
    }
    if (module === 'HEXACO') {
      return (
        <td className="px-5 py-4">
          <div className="flex gap-2 text-xs flex-wrap max-w-[250px]">
            {['H', 'E', 'X', 'A', 'C', 'O'].map(k => (
               <span key={k} className="bg-slate-800 text-slate-300 px-2 py-1 rounded">{k}: {score[k]?.toFixed(1) || '-'}</span>
            ))}
          </div>
        </td>
      );
    }
    if (module === 'WVI') {
      const top3 = score.top3 || [];
      const bottom3 = score.bottom3 || [];
      return (
        <>
          <td className="px-5 py-4">
            <div className="flex gap-1 flex-wrap text-xs max-w-[200px]">
              {top3.map((v: any, i: number) => <span key={i} className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">{v.name}</span>)}
            </div>
          </td>
          <td className="px-5 py-4">
            <div className="flex gap-1 flex-wrap text-xs max-w-[200px]">
              {bottom3.map((v: any, i: number) => <span key={i} className="bg-rose-500/10 text-rose-400 px-2 py-1 rounded">{v.name}</span>)}
            </div>
          </td>
        </>
      );
    }
    if (module === 'SDS') {
      const codes = score.topCodes || [];
      const codeStr = codes.map((c: any) => c.code).join('');
      return (
        <>
          <td className="px-5 py-4 font-bold text-sky-400">{codeStr || '-'}</td>
          <td className="px-5 py-4 text-xs text-slate-400">
             Act: {score.sectionScores?.activities || 0}, Comp: {score.sectionScores?.competencies || 0}, Occ: {score.sectionScores?.occupations || 0}
          </td>
        </>
      );
    }
    if (module === 'CPM') {
      return (
        <td className="px-5 py-4">
          <span className="font-bold text-white">IQ: {score.iq || '-'}</span>
          <span className="text-slate-400 text-xs ml-2">({score.classification || '-'})</span>
        </td>
      );
    }
    if (module === 'KUESIONER_ORTU') {
       return <td className="px-5 py-4 text-slate-400 text-xs">Selesai Diisi</td>;
    }
    if (module === 'OBSERVASI_ANAK') {
       return <td className="px-5 py-4 text-slate-400 text-xs">{item.observation_data ? 'Ada Data' : '-'}</td>;
    }
    if (module === 'WAWANCARA_ANAK') {
       return <td className="px-5 py-4 text-slate-400 text-xs">{item.interview_data ? 'Ada Data' : '-'}</td>;
    }
    return <td className="px-5 py-4 text-slate-400 text-xs">Menunggu data...</td>;
  };

  const getHeaders = () => {
    if (module === 'DISC') return <><th className="px-5 py-4">Pola Perilaku</th><th className="px-5 py-4">Skor D-I-S-C</th></>;
    if (module === 'HEXACO') return <th className="px-5 py-4">Rata-rata Dimensi (H-E-X-A-C-O)</th>;
    if (module === 'WVI') return <><th className="px-5 py-4">3 Nilai Tertinggi</th><th className="px-5 py-4">3 Nilai Terendah</th></>;
    if (module === 'SDS') return <><th className="px-5 py-4">Kode RIASEC</th><th className="px-5 py-4">Rincian Bagian</th></>;
    if (module === 'CPM') return <th className="px-5 py-4">Skor Mentah & IQ</th>;
    if (module === 'OBSERVASI_ANAK' || module === 'WAWANCARA_ANAK' || module === 'KUESIONER_ORTU') return <th className="px-5 py-4">Status Data</th>;
    return <th className="px-5 py-4">Detail</th>;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Rekap Hasil: {module}</h2>
          <p className="text-slate-400 text-sm mt-1">Daftar seluruh klien yang telah menyelesaikan modul {module}</p>
        </div>
        <input
          type="text"
          placeholder="Cari nama klien..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl text-sm focus:border-blue-500 outline-none w-64"
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-800/50 text-slate-400 border-b border-slate-700/50">
              <tr>
                <th className="px-5 py-4 font-semibold tracking-wider">Nama Klien</th>
                <th className="px-5 py-4 font-semibold tracking-wider">Tipe</th>
                {getHeaders()}
                <th className="px-5 py-4 font-semibold tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">Memuat data...</td></tr>
              ) : sortedAndFiltered.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">Belum ada data untuk modul ini.</td></tr>
              ) : (
                sortedAndFiltered.map((item, idx) => {
                  const client = item.clients || item.tokens?.clients || {};
                  const type = item.tokens?.respondent_type || item.respondent_type || 'Unknown';
                  
                  return (
                    <tr key={item.id || idx} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white">{client.name || '-'}</div>
                        <div className="text-xs text-slate-500">{client.email || '-'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="bg-purple-500/10 text-purple-400 font-medium px-2.5 py-1 rounded-md text-xs inline-block">
                          {type}
                        </span>
                      </td>
                      {renderModuleSpecificColumns(item)}
                      <td className="px-5 py-4 text-right">
                        <Link 
                          href={`/admin/reports/${item.tokens?.id || item.id}`}
                          className="text-blue-400 hover:text-blue-300 text-lg font-medium px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg inline-block transition-all"
                          title="Lihat Laporan Lengkap"
                        >
                          📄
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
