'use client';

import { useState, useEffect } from 'react';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useRouter } from 'next/navigation';

export default function WviTestPage() {
  const router = useRouter();
  const [answers, setAnswers, clearAnswers] = useAutoSave<Record<number, number>>('WVI', {});
  const [currentGroup, setCurrentGroup] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/test/questions?code=WVI")
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
  
  const questionsPerGroup = 15;
  const totalGroups = Math.ceil(questions.length / questionsPerGroup);
  
  const currentQuestions = questions.slice(
    currentGroup * questionsPerGroup, 
    (currentGroup + 1) * questionsPerGroup
  );

  if (!isLoaded || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-400 font-medium">Memuat instrumen tes...</p>
        </div>
      </div>
    );
  }

  const handleSelect = (questionNo: number, score: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionNo]: score
    }));
  };

  const isGroupComplete = () => {
    return currentQuestions.every(q => answers[q.no] !== undefined);
  };

  const handleNext = async () => {
    if (currentGroup < totalGroups - 1) {
      setCurrentGroup(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      setIsSubmitting(true);
      
      try {
        const testResultId = sessionStorage.getItem("test_result_id");
        const clientDataStr = sessionStorage.getItem("client_data");
        
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
        // WVI is the last test for EMP package
        router.push('/selesai');
        
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

  const options = [
    { value: 1, label: "Sangat Tidak Penting" },
    { value: 2, label: "Tidak Penting" },
    { value: 3, label: "Netral" },
    { value: 4, label: "Penting" },
    { value: 5, label: "Sangat Penting" },
  ];

  return (
    <div className="min-h-screen bg-slate-900 py-10 flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl px-4 animate-in slide-in-from-right-8 duration-500">
        
        <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 p-6 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Tes Tata Nilai Kerja (WVI)</h1>
            <p className="text-slate-400 mt-1">Seberapa penting aspek-aspek berikut dalam karir ideal Anda?</p>
          </div>
          <div className="text-amber-400 font-semibold text-lg bg-amber-900/30 px-4 py-2 rounded-lg">
            Halaman {currentGroup + 1} / {totalGroups}
          </div>
        </div>

        <div className="space-y-6">
          {currentQuestions.map((q) => {
            return (
              <div key={q.no} className="bg-slate-800 rounded-2xl shadow-lg border border-slate-700 p-6">
                <h3 className="font-semibold text-lg text-slate-100 mb-6 text-center">{q.no}. "{q.text}"</h3>
                
                <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
                  {options.map((opt) => {
                    const isSelected = answers[q.no] === opt.value;
                    return (
                      <button 
                        key={opt.value}
                        onClick={() => handleSelect(q.no, opt.value)}
                        className={`flex-1 p-3 rounded-xl border text-sm font-medium transition-all
                          ${isSelected ? 'bg-amber-600 border-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-400 hover:bg-slate-600'}
                        `}
                      >
                        <div className="text-center">{opt.label}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex justify-between">
          <button
            onClick={handlePrev}
            disabled={currentGroup === 0 || isSubmitting}
            className="px-6 py-3 rounded-xl font-bold text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            Sebelumnya
          </button>
          
          <button
            onClick={handleNext}
            disabled={!isGroupComplete() || isSubmitting}
            className="px-8 py-3 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:bg-slate-700 shadow-lg transition-all"
          >
            {isSubmitting ? 'Menyimpan...' : (currentGroup === totalGroups - 1 ? 'Selesai' : 'Selanjutnya')}
          </button>
        </div>

      </div>
    </div>
  );
}
