"use client";

import { useState, useEffect } from "react";
import { useParams } from 'next/navigation';
import { Users, Upload, Download, CheckCircle, Search, Plus, X, RefreshCw, PenTool, ClipboardCheck, CheckCircle2 } from "lucide-react";
import * as XLSX from 'xlsx';
import DapScoringModal from "@/components/admin/DapScoringModal";
import ObservationModal from "@/components/admin/ObservationModal";

export default function AdminClients() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  
  // Modals state untuk Aksi Penilaian
  const [dapModalOpen, setDapModalOpen] = useState(false);
  const [obsModalOpen, setObsModalOpen] = useState(false);
  const [activeToken, setActiveToken] = useState<any>(null);
  const [activeClient, setActiveClient] = useState<any>(null);
  
  // Modal states untuk Tambah Manual
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    registration_number: '',
    birth_place: '',
    birth_date: '',
    gender: '',
    school_or_institution: '',
    grade: '',
    parent_name: '',
    parent_phone: ''
  });

  const params = useParams();
  const type = params.type as string;

  const typeConfig: Record<string, { purpose: string, title: string }> = {
    child: { purpose: 'CHILD', title: 'Klien Asesmen Anak' },
    student: { purpose: 'STU', title: 'Klien Penjurusan (Remaja)' },
    employee: { purpose: 'EMP', title: 'Klien Rekrutmen (Pegawai)' }
  };
  const config = typeConfig[type] || typeConfig.child;
  const currentPurpose = config.purpose;

  useEffect(() => {
    fetchClients();
  }, [type]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/clients?purpose=${currentPurpose}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setClients(data);
    } catch (err: any) {
      console.error(err);
      alert("Gagal memuat klien: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        nama_lengkap: "Budi Santoso",
        nisn_nik: "1234567890",
        nomor_pendaftaran: "PMB-2026-001",
        jenis_kelamin: "L",
        tempat_lahir: "Jakarta",
        tanggal_lahir_yyyy_mm_dd: "2010-05-15",
        sekolah_institusi: "SDN 1 Jakarta",
        kelas_jabatan: "Kelas 1",
        anak_ke_dari_bersaudara: "1 dari 3",
        nama_orang_tua: "Agus Santoso",
        no_hp_ortu: "081234567890",
        pekerjaan_ortu: "PNS",
        pendidikan_ortu: "S1",
        alamat: "Jl. Sudirman No 1",
        kebutuhan_khusus: "Kacamata Minus (-1)",
        institusi_tujuan: "SDIT Al-Hidayah",
        tujuan_tes: "Seleksi SPMB"
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Klien");
    XLSX.writeFile(wb, "Template_Upload_Klien_CPM.xlsx");
  };

  const handleUploadExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const insertData = data.map((row: any) => ({
          name: row.nama_lengkap,
          registration_number: row.nisn_nik ? String(row.nisn_nik) : null,
          test_registration_number: row.nomor_pendaftaran ? String(row.nomor_pendaftaran) : null,
          gender: row.jenis_kelamin,
          birth_place: row.tempat_lahir,
          birth_date: row.tanggal_lahir_yyyy_mm_dd,
          school_or_institution: row.sekolah_institusi,
          grade: row.kelas_jabatan,
          birth_order: row.anak_ke_dari_bersaudara ? String(row.anak_ke_dari_bersaudara) : null,
          parent_name: row.nama_orang_tua,
          parent_phone: row.no_hp_ortu ? String(row.no_hp_ortu) : null,
          parent_job: row.pekerjaan_ortu,
          parent_education: row.pendidikan_ortu,
          address: row.alamat,
          special_needs: row.kebutuhan_khusus,
          target_institution: row.institusi_tujuan,
          test_purpose: currentPurpose
        }));

        const res = await fetch('/api/admin/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(insertData)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Gagal menyimpan data');
        
        alert(`Berhasil mengunggah ${insertData.length} data klien!`);
        fetchClients();
      } catch (err: any) {
        alert("Gagal mengunggah data: " + err.message);
      } finally {
        setIsUploading(false);
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert('Nama Lengkap wajib diisi!');

    setIsUploading(true);
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{
          name: formData.name,
          registration_number: formData.registration_number || null,
          gender: formData.gender || null,
          birth_place: formData.birth_place || null,
          birth_date: formData.birth_date || null,
          school_or_institution: formData.school_or_institution || null,
          grade: formData.grade || null,
          parent_name: formData.parent_name || null,
          parent_phone: formData.parent_phone || null,
          test_purpose: currentPurpose
        }])
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal menambahkan klien');
      
      alert('Klien berhasil ditambahkan!');
      setShowModal(false);
      setFormData({ name: '', registration_number: '', birth_place: '', birth_date: '', gender: '', school_or_institution: '', grade: '', parent_name: '', parent_phone: '' });
      fetchClients();
    } catch (err: any) {
      alert("Gagal menambahkan klien: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateToken = async (targetPurpose: string) => {
    const emptyClients = clients.filter(c => !c.tokens || c.tokens.length === 0);
    if (emptyClients.length === 0) {
      alert("Semua klien di database sudah memiliki token!");
      return;
    }

    const confirm = window.confirm(`Ditemukan ${emptyClients.length} klien tanpa token. Generate otomatis untuk ${config.title}?`);
    if (!confirm) return;

    setIsUploading(true);
    try {
      const res = await fetch('/api/admin/generate-closed-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientIds: emptyClients.map(c => c.id),
          purpose: targetPurpose
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      
      alert(result.message);
      fetchClients();
    } catch (err: any) {
      alert("Gagal generate token: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetToken = async (tokenId: string) => {
    const confirm = window.confirm("Anda yakin ingin me-reset token ini? Peserta akan mengulang dengan status PENDING.");
    if (!confirm) return;
    try {
      const res = await fetch('/api/admin/reset-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchClients();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      alert("Gagal mereset token: " + err.message);
    }
  };

  const handleFinalizeToken = async (tokenId: string) => {
    const confirm = window.confirm("Tandai sesi tes ini sebagai Selesai? Status token akan ditutup secara permanen.");
    if (!confirm) return;
    try {
      const res = await fetch('/api/admin/finalize-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchClients();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      alert("Gagal menyelesaikan token: " + err.message);
    }
  };

  const filteredClients = clients.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.school_or_institution?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3 drop-shadow-md">
            <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <Users className="text-blue-400 w-6 h-6" /> 
            </div>
            {config.title}
          </h1>
          <p className="text-slate-400 mt-2">Kelola data peserta tes secara manual maupun massal, serta generate token tes tertutup.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button 
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 px-4 py-2.5 rounded-xl transition text-sm font-semibold backdrop-blur-md"
          >
            <Download size={18} />
            Template Excel
          </button>
          
          <div className="relative">
             <input 
               type="file" 
               accept=".xlsx, .xls"
               onChange={handleUploadExcel}
               disabled={isUploading}
               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
             />
             <button className="flex items-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 px-4 py-2.5 rounded-xl transition text-sm font-semibold backdrop-blur-md shadow-[0_0_10px_rgba(16,185,129,0.2)]">
               <Upload size={18} />
               {isUploading ? 'Memproses...' : 'Upload Data Klien'}
             </button>
          </div>

          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 px-4 py-2.5 rounded-xl transition text-sm font-semibold backdrop-blur-md shadow-[0_0_10px_rgba(59,130,246,0.2)]"
          >
            <Plus size={18} />
            Tambah Manual
          </button>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
        <div className="flex justify-between mb-6 flex-wrap gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Cari nama atau instansi..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition placeholder-slate-500"
            />
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => handleGenerateToken(currentPurpose)}
              className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 px-4 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
              disabled={isUploading}
            >
              Generate Token Klien Baru
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 border-b border-white/10">
              <tr className="text-slate-400 text-sm">
                <th className="pb-3 px-4 font-medium">Nama Klien</th>
                <th className="pb-3 px-4 font-medium">Institusi / Kelas</th>
                <th className="pb-3 px-4 font-medium">Tgl Lahir</th>
                {currentPurpose === 'CHILD' ? (
                  <>
                    <th className="pb-3 px-4 font-medium">Token Anak</th>
                    <th className="pb-3 px-4 font-medium">Token Orangtua/Wali</th>
                  </>
                ) : (
                  <th className="pb-3 px-4 font-medium">Status Token</th>
                )}
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8 text-slate-500">Memuat data...</td></tr>
              ) : filteredClients.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-slate-500">Belum ada klien ditemukan.</td></tr>
              ) : (
                filteredClients.map((client) => {
                  const hasToken = client.tokens && client.tokens.length > 0;
                  return (
                    <tr key={client.id} className="border-b border-white/5 hover:bg-white/5 transition group">
                      <td className="py-4 px-4">
                        <div className="font-medium text-white group-hover:text-blue-400 transition-colors">{client.name}</div>
                        {currentPurpose === 'CHILD' && client.parent_name && (
                           <div className="text-[11px] text-slate-500 mt-1">Ortu: {client.parent_name} ({client.parent_phone || '-'})</div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-400">
                        {client.school_or_institution} {client.grade ? `- ${client.grade}` : ''}
                      </td>
                      <td className="py-4 px-4 text-slate-400">{client.birth_date || '-'}</td>
                      
                      {currentPurpose === 'CHILD' ? (() => {
                        const tChild = client.tokens?.find((t: any) => t.respondent_type === 'SELF');
                        const tParent = client.tokens?.find((t: any) => t.respondent_type === 'PARENT');
                        
                        const renderToken = (t: any) => t ? (
                           <div className="flex flex-col items-start gap-2">
                             <div className="flex items-center gap-2">
                               <span className="text-[11px] font-mono font-bold bg-slate-950/50 px-2 py-0.5 rounded text-slate-300 border border-white/10 shadow-inner">
                                 {t.token_code}
                               </span>
                               <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${t.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                 {t.status}
                               </span>
                             </div>
                             
                             <div className="flex flex-wrap items-center gap-1.5">
                               {t.respondent_type === 'SELF' && (
                                 <>
                                   <button 
                                     onClick={() => { setActiveToken(t); setActiveClient(client); setDapModalOpen(true); }}
                                     className="text-[10px] bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 px-2 py-1 rounded transition flex items-center gap-1 font-semibold"
                                   >
                                     <PenTool size={10} /> DAP
                                   </button>
                                   <button 
                                     onClick={() => { setActiveToken(t); setActiveClient(client); setObsModalOpen(true); }}
                                     className="text-[10px] bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 border border-teal-500/30 px-2 py-1 rounded transition flex items-center gap-1 font-semibold"
                                   >
                                     <ClipboardCheck size={10} /> Observasi
                                   </button>
                                 </>
                               )}
                               {t.status !== 'COMPLETED' && (
                                 <button 
                                   onClick={() => handleFinalizeToken(t.id)}
                                   className="text-[10px] bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 px-2 py-1 rounded transition flex items-center gap-1 font-semibold"
                                 >
                                   <CheckCircle2 size={10} /> Selesai
                                 </button>
                               )}
                               {t.status === 'COMPLETED' && (
                                 <a 
                                   href={`/admin/reports/${t.id}/print?download=1`}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="text-[10px] bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 px-2 py-1 rounded transition flex items-center gap-1 font-semibold"
                                 >
                                   <Download size={10} /> Unduh PDF
                                 </a>
                               )}
                               <button 
                                 onClick={() => handleResetToken(t.id)}
                                 className="text-[10px] bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 px-2 py-1 rounded transition flex items-center gap-1 font-semibold"
                               >
                                 <RefreshCw size={10} /> Reset
                               </button>
                             </div>
                           </div>
                        ) : <span className="text-amber-500 text-xs font-semibold bg-amber-500/10 px-2 py-1 rounded-full">Kosong</span>;

                        return (
                          <>
                            <td className="py-4 px-4">{renderToken(tChild)}</td>
                            <td className="py-4 px-4">{renderToken(tParent)}</td>
                          </>
                        );
                      })() : (
                        <td className="py-4 px-4">
                          {hasToken ? (
                             <div className="flex flex-col gap-3">
                               {client.tokens.map((t: any) => (
                                 <div key={t.id} className="flex flex-col items-start gap-2 border-l-2 border-slate-700 pl-3">
                                   <div className="flex items-center gap-2">
                                     <span className="text-[11px] font-mono font-bold bg-slate-950/50 px-2 py-0.5 rounded text-slate-300 border border-white/10 shadow-inner">
                                       {t.respondent_type === 'PARENT' ? '👨‍👩‍👧 PARENT' : currentPurpose === 'STU' ? '🎓 REMAJA' : currentPurpose === 'EMP' ? '💼 PEGAWAI' : '👶 CHILD'}: {t.token_code}
                                     </span>
                                     <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${t.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                       {t.status}
                                     </span>
                                   </div>
                                   
                                   <div className="flex items-center gap-1.5">
                                     {t.status !== 'COMPLETED' && (
                                       <button 
                                         onClick={() => handleFinalizeToken(t.id)}
                                         className="text-[10px] bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 px-2 py-1 rounded transition flex items-center gap-1 font-semibold"
                                       >
                                         <CheckCircle2 size={10} /> Selesai
                                       </button>
                                     )}
                                     {t.status === 'COMPLETED' && (
                                       <a 
                                         href={`/admin/reports/${t.id}/print?download=1`}
                                         target="_blank"
                                         rel="noopener noreferrer"
                                         className="text-[10px] bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 px-2 py-1 rounded transition flex items-center gap-1 font-semibold"
                                       >
                                         <Download size={10} /> Unduh PDF
                                       </a>
                                     )}
                                     <button 
                                       onClick={() => handleResetToken(t.id)}
                                       className="text-[10px] bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 px-2 py-1 rounded transition flex items-center gap-1 font-semibold"
                                     >
                                       <RefreshCw size={10} /> Reset
                                     </button>
                                   </div>
                                 </div>
                               ))}
                             </div>
                          ) : (
                             <span className="text-amber-500 text-xs font-semibold bg-amber-500/10 px-2 py-1 rounded-full">Belum digenerate</span>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH MANUAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl w-full max-w-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                  <Plus className="text-blue-400 w-4 h-4" />
                </div>
                Tambah Data {currentPurpose === 'CHILD' ? 'Anak' : 'Klien'} Manual
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition">
                <X />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="manualForm" onSubmit={handleManualSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nama Lengkap (Wajib)</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:bg-white/10 transition" placeholder="Masukkan nama lengkap klien" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nomor Pendaftaran / NIK</label>
                    <input type="text" value={formData.registration_number} onChange={e => setFormData({...formData, registration_number: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:bg-white/10 transition" placeholder="Opsional" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Jenis Kelamin</label>
                    <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:bg-white/10 transition">
                      <option value="">-- Pilih --</option>
                      <option value="L">Laki-laki (L)</option>
                      <option value="P">Perempuan (P)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tempat Lahir</label>
                    <input type="text" value={formData.birth_place} onChange={e => setFormData({...formData, birth_place: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:bg-white/10 transition" placeholder="Kota Lahir" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tanggal Lahir</label>
                    <input type="date" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:bg-white/10 transition" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Asal {currentPurpose === 'CHILD' || currentPurpose === 'STU' ? 'Sekolah / TK' : 'Institusi / Perusahaan'}</label>
                    <input type="text" value={formData.school_or_institution} onChange={e => setFormData({...formData, school_or_institution: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:bg-white/10 transition" placeholder="Opsional" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Kelas / Jabatan Saat Ini</label>
                    <input type="text" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:bg-white/10 transition" placeholder="Opsional" />
                  </div>
                </div>

                {currentPurpose === 'CHILD' && (
                  <>
                    <div className="border-t border-slate-700/50 pt-5 mt-2">
                      <h3 className="text-sm font-bold text-blue-400 mb-4">Informasi Orang Tua / Wali</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nama Ayah / Ibu / Wali</label>
                          <input type="text" value={formData.parent_name} onChange={e => setFormData({...formData, parent_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:bg-white/10 transition" placeholder="Nama Orang Tua" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nomor Telepon / WA</label>
                          <input type="text" value={formData.parent_phone} onChange={e => setFormData({...formData, parent_phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:bg-white/10 transition" placeholder="08123456789" />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </form>
            </div>
            
            <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-black/20 backdrop-blur-md">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition">Batal</button>
              <button type="submit" form="manualForm" disabled={isUploading} className="px-5 py-2.5 rounded-xl font-bold bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/40 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)] transition disabled:opacity-50 flex items-center gap-2">
                {isUploading ? <RefreshCw className="animate-spin w-4 h-4"/> : <CheckCircle className="w-4 h-4"/>} Simpan Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS PENILAIAN */}
      {activeToken && activeClient && (
        <>
          <DapScoringModal 
            isOpen={dapModalOpen}
            onClose={() => setDapModalOpen(false)}
            tokenId={activeToken.id}
            clientId={activeClient.id}
            clientName={activeClient.name}
            onSuccess={() => fetchClients()}
          />

          <ObservationModal
            isOpen={obsModalOpen}
            onClose={() => setObsModalOpen(false)}
            tokenId={activeToken.id}
            clientName={activeClient.name}
            tokenCode={activeToken.token_code}
            onSuccess={() => fetchClients()}
          />
        </>
      )}
    </div>
  );
}
