"use client";

import { useState } from 'react';
import { AlertCircle, PencilLine, Save, Printer, Briefcase, GraduationCap, Baby } from 'lucide-react';
import TipTapEditor from '../ui/TipTapEditor';

export type ReportContextType = 'EMPLOYEE' | 'STUDENT' | 'CHILD';

export interface DynamicConflictFlag {
  dimension: string;
  sourceA_Label: string;
  sourceA_Value: string | number;
  sourceB_Label: string;
  sourceB_Value: string | number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
}

export interface ClinicalWorkspaceProps {
  reportType: ReportContextType;
  clientName: string;
  aiDraft: any; // Raw JSON or Markdown string, we'll convert it to HTML
  conflictFlags: DynamicConflictFlag[];
  onSave: (finalHtml: string) => void;
  onPrint: () => void;
}

export default function ClinicalWorkspace({ 
  reportType, 
  clientName,
  aiDraft, 
  conflictFlags, 
  onSave, 
  onPrint 
}: ClinicalWorkspaceProps) {
  
  // Convert basic markdown/text to HTML for the editor
  let initialHtml = "";
  if (typeof aiDraft === "string") {
     initialHtml = `<p>${aiDraft.replace(/\n/g, "<br>")}</p>`;
  } else if (aiDraft && typeof aiDraft === "object") {
     // If it's a JSON structure (like our EMP/STU data), we format it nicely
     initialHtml = `
       <h2>Kekuatan Utama</h2>
       <ul>${(aiDraft.kekuatanUtama || []).map((k:string) => `<li>${k}</li>`).join('')}</ul>
       <h2>Tantangan & Hambatan</h2>
       <p>${aiDraft.tantanganHambatan?.areaFriksi || ''}</p>
       <p>${aiDraft.tantanganHambatan?.karakterInternal || ''}</p>
       <h2>Saran Pengembangan</h2>
       <ul>${(aiDraft.saranPengembangan || []).map((s:string) => `<li>${s}</li>`).join('')}</ul>
     `;
  }

  const [finalReport, setFinalReport] = useState(initialHtml);
  const [isSaving, setIsSaving] = useState(false);

  // Konfigurasi dinamis berdasarkan tipe laporan
  const config = {
    EMPLOYEE: {
      title: 'Sintesis Rekrutmen & Asesmen',
      icon: <Briefcase className="w-6 h-6 text-indigo-400" />,
      desc: 'Sesuaikan draf AI untuk kebutuhan HRD dan User Manajerial.'
    },
    STUDENT: {
      title: 'Sintesis Minat, Bakat & Penjurusan',
      icon: <GraduationCap className="w-6 h-6 text-emerald-400" />,
      desc: 'Sesuaikan bahasa untuk memandu Guru BK dan Siswa dalam memilih karier.'
    },
    CHILD: {
      title: 'Sintesis Tumbuh Kembang Anak',
      icon: <Baby className="w-6 h-6 text-rose-400" />,
      desc: 'Gunakan bahasa yang empatik dan memberdayakan untuk Orang Tua.'
    }
  }[reportType];

  const handleSave = () => {
    setIsSaving(true);
    onSave(finalReport);
    setTimeout(() => setIsSaving(false), 800);
  };

  return (
    <div className="mt-12 border-t border-slate-800/80 pt-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {config.icon}
            <h2 className="text-2xl font-bold text-slate-100">{config.title}</h2>
          </div>
          <p className="text-sm text-slate-400">
            Klien: <span className="font-medium text-slate-300">{clientName || "-"}</span> — {config.desc}
          </p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition-colors text-sm font-bold shadow-sm"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Menyimpan...' : 'Simpan Draf'}
          </button>
          <button 
            onClick={onPrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors text-sm font-bold shadow-lg shadow-indigo-900/40"
          >
            <Printer className="w-4 h-4" />
            Finalisasi & Cetak
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* KOLOM KIRI (70%): Rich Text Editor */}
        <div className="lg:col-span-8 bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="bg-slate-800/40 px-5 py-3 border-b border-slate-800 flex justify-between items-center backdrop-blur-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Workspace Editor AI</span>
            <PencilLine className="w-4 h-4 text-slate-500" />
          </div>
          <div className="p-0">
             <TipTapEditor 
               initialContent={initialHtml} 
               onChange={setFinalReport} 
             />
          </div>
        </div>

        {/* KOLOM KANAN (30%): Conflict Flags Panel */}
        <div className="lg:col-span-4 space-y-4 sticky top-24">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
             Validasi Lintas-Modul
          </h3>
          
          {!conflictFlags || conflictFlags.length === 0 ? (
            <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-900/30 text-emerald-400/90 text-sm text-center shadow-inner">
              Tidak ada inkonsistensi signifikan yang terdeteksi pada laporan ini.
            </div>
          ) : (
            conflictFlags.map((flag, idx) => (
              <div 
                key={idx}
                className="group relative p-5 rounded-2xl border bg-slate-900/40 hover:bg-slate-900/80 border-slate-700/50 hover:border-amber-700/50 transition-all backdrop-blur-md shadow-lg"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${flag.severity === 'HIGH' ? 'bg-red-500' : 'bg-amber-500'}`} />
                
                <div className="flex gap-4">
                  <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${flag.severity === 'HIGH' ? 'text-red-400' : 'text-amber-400'}`} />
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">
                      Anomali: {flag.dimension}
                    </h4>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      {flag.message}
                    </p>
                    
                    <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 font-mono text-[10px] space-y-1.5">
                      <div className="flex justify-between items-center text-slate-300 gap-4">
                        <span className="opacity-60 shrink-0">{flag.sourceA_Label}:</span>
                        <span className="font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded text-right">{flag.sourceA_Value}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300 gap-4">
                        <span className="opacity-60 shrink-0">{flag.sourceB_Label}:</span>
                        <span className="font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded text-right">{flag.sourceB_Value}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
