'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HexacoTestPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/test/questions?code=HEXACO")
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        const mappedData = data.map((q: any) => ({
           ...q,
           no: parseInt(q.id, 10),
           text_id: q.text // Mapping the API text to text_id
        }));
        setQuestions(mappedData);
        setIsLoaded(true);
      })
      .catch(err => console.error("Gagal memuat soal", err));
  }, []);
  
  const questionsPerPage = 10;
  const totalPages = Math.ceil(questions.length / questionsPerPage);
  
  const currentQuestions = questions.slice(
    currentPage * questionsPerPage, 
    (currentPage + 1) * questionsPerPage
  );

  if (!isLoaded || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 font-medium">Memuat instrumen tes...</p>
        </div>
      </div>
    );
  }

  const handleSelect = (questionId: number, value: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const isPageComplete = () => {
    return currentQuestions.every(q => answers[q.no]);
  };

  const handleNext = async () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      setIsSubmitting(true);
      
      try {
        const testResultId = sessionStorage.getItem("test_result_id");
        const clientDataStr = sessionStorage.getItem("client_data");
        
        // Simpan hasil HEXACO
        await fetch("/api/save-result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            test_result_id: testResultId,
            resultsLog: answers,
            clientData: clientDataStr ? JSON.parse(clientDataStr) : {}
          })
        });

        alert("Asesmen Kepribadian (HEXACO) Selesai! Seluruh Rangkaian Tes telah diselesaikan.");
        
        // Bersihkan session
        sessionStorage.removeItem("current_participant");
        sessionStorage.removeItem("test_result_id");
        const tokenCode = sessionStorage.getItem("token_code") || "";
        const tokenId = sessionStorage.getItem("valid_token_id") || sessionStorage.getItem("current_token_id");
        const clientData = clientDataStr ? JSON.parse(clientDataStr) : {};

        if (tokenCode.startsWith("EMP-")) {
          // Mulai sesi WVI untuk Rekrutmen
          const startRes = await fetch("/api/start-test", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token_id: tokenId, client_id: clientData.id, test_code: "WVI" })
          });
          
          const startData = await startRes.json();
          if (startData.success) {
            sessionStorage.setItem("test_result_id", startData.test_result_id);
            router.push('/test/wvi');
          } else {
            alert("Gagal melanjutkan tes.");
          }
        } else if (tokenCode.startsWith("STU-")) {
          // Mulai sesi RIASEC untuk Penjurusan
          const startRes = await fetch("/api/start-test", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token_id: tokenId, client_id: clientData.id, test_code: "RIASEC" })
          });
          
          const startData = await startRes.json();
          if (startData.success) {
            sessionStorage.setItem("test_result_id", startData.test_result_id);
            router.push('/test/riasec');
          } else {
            alert("Gagal melanjutkan tes.");
          }
        } else {
          router.push('/selesai');
        }
        setIsSubmitting(false);
      } catch (err) {
        console.error(err);
        alert("Gagal menyimpan hasil tes.");
        setIsSubmitting(false);
      }
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const getProgressWidth = () => {
    const totalAnswered = Object.keys(answers).length;
    return `${(totalAnswered / questions.length) * 100}%`;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-4xl mx-auto px-4 animate-in slide-in-from-right-8 duration-500">
        <div className="mb-8 flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Bagian 3: Profil Karakter (HEXACO)</h1>
            <p className="text-slate-500 mt-2 text-sm leading-relaxed max-w-2xl">
              Tentukan seberapa setuju Anda dengan setiap pernyataan berikut ini. 
              Mulai dari Sangat Tidak Setuju (1) hingga Sangat Setuju (5). Tidak ada jawaban yang benar atau salah.
            </p>
          </div>
          
          <div className="w-full md:w-48 shrink-0">
            <div className="flex justify-between text-xs font-semibold text-emerald-600 mb-1.5">
              <span>Progress</span>
              <span>{Object.keys(answers).length} / {questions.length}</span>
            </div>
            <div className="h-2.5 w-full bg-emerald-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-300" 
                style={{ width: getProgressWidth() }}
              ></div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {currentQuestions.map((q) => {
            return (
              <div key={q.no} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-200 transition-colors">
                <h3 className="text-lg text-slate-700 font-medium mb-5">{q.no}. {q.text_id}</h3>
                
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-2">
                  <span className="text-xs font-semibold text-slate-400 hidden sm:block w-32 text-right pr-4">Sangat Tidak Setuju</span>
                  
                  <div className="flex justify-between sm:justify-center w-full sm:w-auto gap-2 md:gap-4 flex-1">
                    {[1, 2, 3, 4, 5].map((val) => {
                      const isSelected = answers[q.no] === val;
                      // Color mapping based on scale (1=rose, 3=slate, 5=emerald)
                      let colorClass = "border-slate-300 hover:border-emerald-400";
                      
                      if (isSelected) {
                        if (val <= 2) { colorClass = "border-rose-500 bg-rose-50"; }
                        else if (val === 3) { colorClass = "border-blue-500 bg-blue-50"; }
                        else { colorClass = "border-emerald-500 bg-emerald-50"; }
                      }

                      return (
                        <div key={val} className="flex flex-col items-center gap-2">
                          <button
                            onClick={() => handleSelect(q.no, val)}
                            className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center font-bold transition-all shadow-sm \${colorClass} \${isSelected ? 'text-slate-800 scale-110 shadow-md' : 'text-slate-500 scale-100'}`}
                          >
                            {val}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  
                  <span className="text-xs font-semibold text-slate-400 hidden sm:block w-32 text-left pl-4">Sangat Setuju</span>
                </div>
                
                {/* Mobile labels */}
                <div className="flex justify-between w-full mt-3 sm:hidden px-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Sangat Tidak Setuju</span>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Sangat Setuju</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 mb-20 flex justify-between items-center">
          <button 
            onClick={handlePrev}
            disabled={currentPage === 0 || isSubmitting}
            className={`px-8 py-3 rounded-xl font-medium transition-all \${currentPage === 0 ? 'opacity-0 pointer-events-none' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            Kembali
          </button>
          
          <button 
            onClick={handleNext}
            disabled={!isPageComplete() || isSubmitting}
            className={`px-8 py-3 rounded-xl font-medium transition-all shadow-sm
              \${isPageComplete() 
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md hover:-translate-y-0.5' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }
            `}
          >
            {isSubmitting ? 'Memproses...' : (currentPage === totalPages - 1 ? 'Selesai & Kirim Jawaban' : 'Halaman Selanjutnya')}
          </button>
        </div>
      </div>
    </div>
  );
}
