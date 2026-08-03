'use client';

import { useState, useEffect } from 'react';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useRouter } from 'next/navigation';

export default function DiscTestPage() {
  const router = useRouter();
  const [answers, setAnswers, clearAnswers] = useAutoSave<Record<number, { most?: string, least?: string }>>('DISC', {});
  const [currentGroup, setCurrentGroup] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/test/questions?code=DISC")
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        const mappedData = data.map((q: any) => ({
           ...q,
           no: parseInt(q.id, 10)
        }));
        setQuestions(mappedData);
        setIsLoaded(true);
      })
      .catch(err => console.error("Gagal memuat soal", err));
  }, []);
  
  const questionsPerGroup = 4;
  const totalGroups = Math.ceil(questions.length / questionsPerGroup);
  
  const currentQuestions = questions.slice(
    currentGroup * questionsPerGroup, 
    (currentGroup + 1) * questionsPerGroup
  );

  if (!isLoaded || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 font-medium">Memuat instrumen tes...</p>
        </div>
      </div>
    );
  }

  const handleSelect = (questionNo: number, type: 'most' | 'least', trait: string) => {
    setAnswers(prev => {
      const currentQAnswers = prev[questionNo] || {};
      
      // Mencegah trait yang sama dipilih untuk most dan least
      if (type === 'most' && currentQAnswers.least === trait) return prev;
      if (type === 'least' && currentQAnswers.most === trait) return prev;

      return {
        ...prev,
        [questionNo]: {
          ...currentQAnswers,
          [type]: trait
        }
      };
    });
  };

  const isGroupComplete = () => {
    return currentQuestions.every(q => 
      answers[q.no] && answers[q.no].most && answers[q.no].least
    );
  };

  const handleNext = async () => {
    if (currentGroup < totalGroups - 1) {
      setCurrentGroup(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      // Selesai seluruh test
      setIsSubmitting(true);
      
      try {
        const testResultId = sessionStorage.getItem("test_result_id");
        const clientDataStr = sessionStorage.getItem("client_data");
        
        // 1. Simpan hasil DISC
        await fetch("/api/save-result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            test_result_id: testResultId,
            resultsLog: answers,
            clientData: clientDataStr ? JSON.parse(clientDataStr) : {}
          })
        });

        clearAnswers();
        alert("Asesmen Gaya Kerja (DISC) Selesai!");

        const tokenCode = sessionStorage.getItem("token_code") || "";
        if (tokenCode.startsWith("EMP-")) {
          // 2. Mulai sesi HEXACO
          const tokenId = sessionStorage.getItem("valid_token_id") || sessionStorage.getItem("current_token_id");
          const clientData = clientDataStr ? JSON.parse(clientDataStr) : {};
          
          const startRes = await fetch("/api/start-test", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token_id: tokenId, client_id: clientData.id, test_code: "HEXACO" })
          });
          
          const startData = await startRes.json();
          if (startData.success) {
            sessionStorage.setItem("test_result_id", startData.test_result_id);
            router.push('/test/hexaco');
          } else {
            alert("Gagal melanjutkan tes.");
          }
        } else {
          router.push('/selesai');
        }
      } catch (err) {
        console.error(err);
        alert("Gagal menyimpan hasil tes.");
        setIsSubmitting(false);
      }
    }
  };

  const handlePrev = () => {
    if (currentGroup > 0) {
      setCurrentGroup(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-4xl mx-auto px-4 animate-in slide-in-from-right-8 duration-500">
        
        <div className="mb-8 flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Bagian 2: Profil Gaya Kerja (DISC)</h1>
            <p className="text-slate-500 mt-2 text-sm leading-relaxed max-w-2xl">
              Pada setiap kelompok pernyataan di bawah ini, pilih SATU pernyataan yang <strong className="text-blue-600">PALING (Most)</strong> menggambarkan diri Anda, 
              dan SATU yang <strong className="text-rose-500">PALING TIDAK (Least)</strong> menggambarkan diri Anda.
            </p>
          </div>
          <div className="shrink-0 bg-slate-100 px-4 py-2 rounded-full text-slate-600 font-medium text-sm">
            Halaman {currentGroup + 1} dari {totalGroups}
          </div>
        </div>

        <div className="space-y-8">
          {currentQuestions.map((q) => {
            const qAnswers = answers[q.no] || {};
            return (
              <div key={q.no} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                  <h3 className="font-bold text-slate-700">Pernyataan #{q.no}</h3>
                </div>
                <div className="p-0">
                  <div className="grid grid-cols-12 gap-0 border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <div className="col-span-8 md:col-span-10 p-4">Pernyataan</div>
                    <div className="col-span-2 md:col-span-1 p-4 text-center text-blue-600">MOST</div>
                    <div className="col-span-2 md:col-span-1 p-4 text-center text-rose-500">LEAST</div>
                  </div>
                  
                  {q.options.map((opt: any, idx: number) => {
                    const traitValue = opt.trait || opt.value || opt.key || opt.type || opt.m || opt.karakter || opt.kategori;
                    const isMostSelected = traitValue !== undefined && qAnswers.most === traitValue;
                    const isLeastSelected = traitValue !== undefined && qAnswers.least === traitValue;
                    
                    return (
                      <div 
                        key={idx} 
                        className={`grid grid-cols-12 gap-0 border-b border-slate-100 last:border-0 transition-colors
                          ${isMostSelected ? 'bg-blue-50/50' : ''} 
                          ${isLeastSelected ? 'bg-rose-50/50' : ''}
                          hover:bg-slate-50
                        `}
                      >
                        <div className="col-span-8 md:col-span-10 p-4 flex items-center text-slate-700 text-sm md:text-base">
                          {opt.text}
                        </div>

                        {/* MOST Radio Button */}
                        <div 
                          className="col-span-2 md:col-span-1 p-4 flex items-center justify-center border-l border-slate-100 cursor-pointer"
                          onClick={() => traitValue && handleSelect(q.no, 'most', traitValue)}
                        >
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isMostSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-300'} ${isLeastSelected ? 'opacity-30 cursor-not-allowed' : 'hover:border-blue-400'}`}>
                            {isMostSelected && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                          </div>
                        </div>

                        {/* LEAST Radio Button */}
                        <div 
                          className="col-span-2 md:col-span-1 p-4 flex items-center justify-center border-l border-slate-100 cursor-pointer"
                          onClick={() => traitValue && handleSelect(q.no, 'least', traitValue)}
                        >
                           <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isLeastSelected ? 'border-rose-500 bg-rose-500' : 'border-slate-300'} ${isMostSelected ? 'opacity-30 cursor-not-allowed' : 'hover:border-rose-400'}`}>
                            {isLeastSelected && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 mb-20 flex justify-between items-center">
          <button 
            onClick={handlePrev}
            disabled={currentGroup === 0 || isSubmitting}
            className={`px-8 py-3 rounded-xl font-medium transition-all \${currentGroup === 0 ? 'opacity-0 pointer-events-none' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            Kembali
          </button>
          
          <button 
            onClick={handleNext}
            disabled={!isGroupComplete() || isSubmitting}
            className={`px-8 py-3 rounded-xl font-medium transition-all shadow-sm
              ${isGroupComplete() 
                ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5' 
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
              }
            `}
          >
            {isSubmitting ? 'Memproses...' : (currentGroup === totalGroups - 1 ? 'Kirim Jawaban' : 'Selanjutnya')}
          </button>
        </div>
      </div>
    </div>
  );
}
