"use client";

import { useEffect, useState } from "react";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useRouter } from "next/navigation";

export default function ParentQuestionnaire() {
  const router = useRouter();
  const [step, setStep, clearStep] = useAutoSave('PQ_STEP', 1);
  const [loading, setLoading] = useState(false);
  const [clientData, setClientData] = useState<any>(null);

  const [historyAnswers, setHistoryAnswers, clearHistory] = useAutoSave('PQ_HISTORY', { kehamilan: "", medis: "", perkembangan: "" });
  const [sdqAnswers, setSdqAnswers, clearSdq] = useAutoSave<Record<string, number>>('PQ_SDQ', {});
  const [abicAnswers, setAbicAnswers, clearAbic] = useAutoSave<Record<string, boolean>>('PQ_ABIC', {
    makan: false, mandi: false, berpakaian: false, bergaul: false
  });

  useEffect(() => {
    const data = sessionStorage.getItem("client_data");
    if (data) {
      setClientData(JSON.parse(data));
    }
  }, []);

  const handleSdqChange = (qNum: number, val: number) => {
    setSdqAnswers(prev => ({ ...prev, [`q${qNum}`]: val }));
  };

  const handleAbicChange = (key: string, val: boolean) => {
    setAbicAnswers(prev => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    // Siapkan raw_data
    const resultsLog = [
      { type: 'HISTORY', responses: historyAnswers },
      { type: 'SDQ', responses: sdqAnswers },
      { type: 'ABIC', responses: abicAnswers }
    ];

    try {
      const payload = {
        test_result_id: sessionStorage.getItem("test_result_id"),
        resultsLog: resultsLog,
        clientData: clientData
      };

      const res = await fetch("/api/save-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Gagal menyimpan jawaban.");

      // Selesai
      clearStep();
      clearHistory();
      clearSdq();
      clearAbic();
      
      router.push("/test/parent_q/finish");
    } catch (err: any) {
      alert(err.message);
      setLoading(false);
    }
  };

  if (!clientData) return <div className="p-10 text-center">Memuat data anak...</div>;

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-2xl bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
        <h1 className="text-2xl font-bold text-center mb-2">Kuesioner Observasi</h1>
        <p className="text-center text-slate-500 mb-8">Data Perilaku & Keseharian: <b>{clientData.name}</b></p>
        
        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {[1,2,3].map(s => (
            <div key={s} className={`h-2 flex-1 rounded-full ${step >= s ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
          ))}
        </div>

        {/* STEP 1: HISTORY */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in-up">
            <h2 className="text-xl font-bold text-blue-800">Bagian 1: Riwayat Tumbuh Kembang</h2>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">1. Bagaimana kondisi selama kehamilan dan proses persalinan?</label>
              <textarea 
                className="w-full p-4 border-2 rounded-xl focus:border-blue-500 outline-none" 
                rows={3} 
                value={historyAnswers.kehamilan}
                onChange={e => setHistoryAnswers({...historyAnswers, kehamilan: e.target.value})}
                placeholder="Misal: Lahir prematur, normal, dll..." 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">2. Apakah anak memiliki riwayat penyakit medis khusus / kejang / trauma?</label>
              <textarea 
                className="w-full p-4 border-2 rounded-xl focus:border-blue-500 outline-none" 
                rows={3} 
                value={historyAnswers.medis}
                onChange={e => setHistoryAnswers({...historyAnswers, medis: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">3. Kapan anak mulai bisa berjalan dan berbicara kalimat?</label>
              <textarea 
                className="w-full p-4 border-2 rounded-xl focus:border-blue-500 outline-none" 
                rows={3} 
                value={historyAnswers.perkembangan}
                onChange={e => setHistoryAnswers({...historyAnswers, perkembangan: e.target.value})}
              />
            </div>
            <button onClick={() => setStep(2)} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl">Lanjut ke Bagian 2</button>
          </div>
        )}

        {/* STEP 2: SDQ (Versi Ringkas untuk Prototype) */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in-up">
            <h2 className="text-xl font-bold text-blue-800">Bagian 2: Evaluasi Emosi & Perilaku (SDQ)</h2>
            <p className="text-sm text-slate-500 mb-4">Pilih jawaban yang paling sesuai dengan perilaku anak selama 6 bulan terakhir.</p>
            
            <div className="space-y-4">
              {/* Render 5 butir pertama sebagai contoh prototype */}
              {["Anak saya dapat mempertimbangkan perasaan orang lain", 
                "Gelisah, terlalu aktif, tidak dapat diam", 
                "Sering mengeluh sakit kepala, sakit perut, dll",
                "Bersedia berbagi dengan anak lain",
                "Sering marah meledak-ledak"].map((qText, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="font-semibold mb-3">{idx + 1}. {qText}</p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm"><input type="radio" name={`q${idx+1}`} onChange={() => handleSdqChange(idx+1, 0)} /> Tidak Benar</label>
                    <label className="flex items-center gap-2 text-sm"><input type="radio" name={`q${idx+1}`} onChange={() => handleSdqChange(idx+1, 1)} /> Agak Benar</label>
                    <label className="flex items-center gap-2 text-sm"><input type="radio" name={`q${idx+1}`} onChange={() => handleSdqChange(idx+1, 2)} /> Sangat Benar</label>
                  </div>
                </div>
              ))}
              <p className="text-xs text-red-400 italic">*Untuk versi final, butir 6-25 akan diload otomatis.</p>
            </div>
            
            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="w-1/3 bg-slate-200 text-slate-700 font-bold py-4 rounded-xl">Kembali</button>
              <button onClick={() => setStep(3)} className="w-2/3 bg-blue-600 text-white font-bold py-4 rounded-xl">Lanjut ke Bagian Terakhir</button>
            </div>
          </div>
        )}

        {/* STEP 3: ABIC */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in-up">
            <h2 className="text-xl font-bold text-blue-800">Bagian 3: Kemandirian Sehari-hari</h2>
            <p className="text-sm text-slate-500 mb-4">Centang aktivitas yang SUDAH BISA dilakukan anak secara mandiri tanpa bantuan.</p>
            
            <div className="space-y-3">
              {[
                { key: 'makan', label: 'Makan dan minum sendiri tanpa disuapi' },
                { key: 'mandi', label: 'Mandi dan ke toilet sendiri (termasuk membersihkan diri)' },
                { key: 'berpakaian', label: 'Memilih pakaian dan berpakaian sendiri' },
                { key: 'bergaul', label: 'Bermain interaktif dengan teman sebaya (bukan paralel)' },
              ].map(item => (
                <label key={item.key} className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100">
                  <input type="checkbox" className="w-5 h-5 accent-blue-600" onChange={e => handleAbicChange(item.key, e.target.checked)} />
                  <span className="font-semibold text-slate-700">{item.label}</span>
                </label>
              ))}
            </div>
            
            <div className="flex gap-4">
              <button onClick={() => setStep(2)} className="w-1/3 bg-slate-200 text-slate-700 font-bold py-4 rounded-xl">Kembali</button>
              <button onClick={handleSubmit} disabled={loading} className="w-2/3 bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl flex justify-center items-center">
                {loading ? "Menyimpan..." : "Selesai & Kirim Observasi"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
