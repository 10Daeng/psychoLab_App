'use client';

import { useState, useEffect, useRef } from 'react';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Raven2TestPage() {
  const router = useRouter();
  const [currentQuestionIdx, setCurrentQuestionIdx, clearIdx, idxInit] = useAutoSave('RAVEN_INDEX', 0);
  const [answers, setAnswers, clearAnswers, ansInit] = useAutoSave<Record<number, { answer: string, time_taken_ms: number }>>('RAVEN_ANSWERS', {});
  // Global Timer (24 Menit = 1440 Detik)
  const [remainingTime, setRemainingTime, clearTime, timeInit] = useAutoSave('RAVEN_TIMER', 1440);
  
  const answersRef = useRef(answers);
  const [startTime, setStartTime] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);

  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [workerStarted, setWorkerStarted] = useState(false);
  
  const workerRef = useRef<Worker | null>(null);
  const allStateLoaded = idxInit && ansInit && timeInit;

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    // Load soal via API aman
    fetch("/api/test/questions?code=RAVEN2")
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setQuestions(data);
        setIsLoaded(true);
      })
      .catch(err => {
        console.error("Gagal memuat soal", err);
      });
      
    return () => {
      if (workerRef.current) {
        workerRef.current.postMessage({ command: "STOP" });
        workerRef.current.terminate();
      }
    };
  }, []);

  // Memulai timer hanya ketika semua state lokal tersimpan sudah berhasil dimuat (isInitialized)
  useEffect(() => {
    if (isLoaded && allStateLoaded && !workerStarted) {
      workerRef.current = new Worker(new URL("/workers/timer.js", window.location.origin));
      workerRef.current.onmessage = (e: MessageEvent) => {
        if (e.data.type === "TICK") {
          setRemainingTime(e.data.remainingSeconds);
        } else if (e.data.type === "TIMEOUT") {
          handleTimeout();
        }
      };
      
      // Jika waktu sebelumnya sudah habis, langsung trigger timeout
      if (remainingTime <= 0) {
        handleTimeout();
      } else {
        workerRef.current.postMessage({ command: "START", seconds: remainingTime });
        setWorkerStarted(true);
      }
    }
  }, [isLoaded, allStateLoaded, workerStarted, remainingTime]);

  useEffect(() => {
    // Mulai timer soal ketika komponen/soal render
    if (isLoaded && allStateLoaded) setStartTime(performance.now());
  }, [currentQuestionIdx, isLoaded, allStateLoaded]);

  if (!isLoaded || !allStateLoaded || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-400 font-medium">Memuat instrumen tes...</p>
        </div>
      </div>
    );
  }

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    let cleanPath = path.replace(/^\/+/, '');
    
    // Asumsikan semua path relative adalah milik Raven di bucket
    return `https://bgenakkulsrzchckkefv.supabase.co/storage/v1/object/public/test-images/Raven2/${cleanPath.split('/').pop()}`;
  };

  const currentQ = questions[currentQuestionIdx];

  const handleSelect = (optionLabel: string) => {
    const endTime = performance.now();
    const timeTaken = Math.round(endTime - startTime);

    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: { answer: optionLabel, time_taken_ms: timeTaken }
    }));

    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    }
  };

  const handleTimeout = () => {
    setIsTimeUp(true);
    handleSubmit(true);
  };

  const isComplete = Object.keys(answers).length === questions.length;

  const handleSubmit = async (forceSubmit = false) => {
    if (!forceSubmit && currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      setIsSubmitting(true);
      if (workerRef.current) {
        workerRef.current.postMessage({ command: "STOP" });
        workerRef.current.terminate();
      }
      
      try {
        const testResultId = sessionStorage.getItem("test_result_id");
        const clientDataStr = sessionStorage.getItem("client_data");
        
        // 1. Simpan hasil RAVEN2
        await fetch("/api/save-result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            test_result_id: testResultId,
            resultsLog: forceSubmit ? answersRef.current : answers,
            clientData: clientDataStr ? JSON.parse(clientDataStr) : {}
          })
        });

        clearIdx();
        clearAnswers();
        clearTime();


        const tokenCode = sessionStorage.getItem("token_code") || "";
        const tokenId = sessionStorage.getItem("valid_token_id") || sessionStorage.getItem("current_token_id");
        const clientData = clientDataStr ? JSON.parse(clientDataStr) : {};

        if (tokenCode.startsWith("EMP-")) {
          // Mulai sesi DISC untuk Rekrutmen
          const startRes = await fetch("/api/start-test", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token_id: tokenId, client_id: clientData.id, test_code: "DISC" })
          });
          
          const startData = await startRes.json();
          if (startData.success) {
            sessionStorage.setItem("test_result_id", startData.test_result_id);
            router.push('/test/disc');
          } else {
            alert("Gagal melanjutkan tes.");
          }
        } else if (tokenCode.startsWith("STU-")) {
          // Mulai sesi RIASEC untuk Penjurusan Siswa
          const startRes = await fetch("/api/start-test", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token_id: tokenId, client_id: clientData.id, test_code: "SDS" })
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
      } catch (err) {
        console.error(err);
        alert("Gagal menyimpan hasil tes.");
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-10 flex flex-col items-center justify-center">
      <div className="w-full max-w-5xl px-4">
        
        {/* Header Progress & Timer */}
        <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 p-6 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold text-white">Tes Kognitif (Matriks Penalaran)</h1>
          <div className="flex items-center gap-6">
             <div className={`font-mono text-xl font-bold px-4 py-2 rounded-xl flex items-center gap-2 ${remainingTime <= 300 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-slate-700 text-slate-300'}`}>
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
               </svg>
               {Math.floor(remainingTime / 60).toString().padStart(2, '0')}:{(remainingTime % 60).toString().padStart(2, '0')}
             </div>
             <div className="text-slate-300 font-semibold text-lg bg-slate-700 px-4 py-2 rounded-xl">
               Soal {currentQuestionIdx + 1} / {questions.length}
             </div>
          </div>
        </div>

        {/* Soal Area */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
          
          {/* Bagian Pertanyaan (Gambar Utama) */}
          <div className="w-full md:w-3/5 p-8 flex flex-col items-center justify-center bg-slate-50 border-r border-slate-200">
            <h2 className="text-slate-500 font-semibold mb-6">Pilih potongan gambar yang tepat untuk melengkapi pola di bawah ini.</h2>
            <div className="relative w-full aspect-square max-w-md bg-white border-2 border-slate-200 rounded-xl overflow-hidden flex items-center justify-center shadow-inner">
               <Image 
                 src={getImageUrl(currentQ.problemImage)} 
                 alt="Soal Raven" 
                 fill 
                 className="object-contain p-4"
                 unoptimized
                 onError={(e) => {
                   // Fallback jika gambar tidak ditemukan
                   (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWVlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+R2FtYmFyIFRpZGFrIERpdGVtdWthbjwvdGV4dD48L3N2Zz4=';
                 }}
               />
            </div>
          </div>

          {/* Bagian Pilihan Jawaban */}
          <div className="w-full md:w-2/5 p-8 bg-white flex flex-col">
            <h3 className="text-slate-800 font-bold text-xl mb-6">Pilihan Jawaban:</h3>
            <div className="grid grid-cols-2 gap-4 flex-grow">
              {currentQ.options.map((optUrl: string, idx: number) => {
                const label = String.fromCharCode(65 + idx);
                const stringAnswer = (idx + 1).toString();
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(stringAnswer)}
                    className="relative group rounded-xl border-2 border-slate-200 hover:border-blue-500 overflow-hidden bg-slate-50 aspect-square transition-all hover:shadow-lg flex flex-col items-center justify-center"
                  >
                    <div className="absolute top-2 left-2 w-6 h-6 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center text-xs font-bold group-hover:bg-blue-500 group-hover:text-white transition-colors z-10">
                      {label}
                    </div>
                    <div className="relative w-full h-full p-4">
                      <Image 
                        src={getImageUrl(optUrl)} 
                        alt={`Opsi ${label}`} 
                        fill 
                        className="object-contain"
                        unoptimized
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Tombol Submit di Akhir */}
            {isComplete && (
               <button
                 onClick={() => handleSubmit(false)}
                 disabled={isSubmitting}
                 className="mt-8 w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg disabled:opacity-50 hover:bg-green-700 transition-colors shadow-lg"
               >
                 {isSubmitting ? 'Menyimpan Jawaban...' : 'Selesaikan Tes'}
               </button>
            )}
          </div>
        </div>
      </div>

      {/* Layar Transisi Waktu Habis / Submitting */}
      {(isTimeUp || isSubmitting) && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-fade-in-up">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                 {isTimeUp ? (
                   <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                 ) : (
                   <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                   </svg>
                 )}
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {isTimeUp ? "Waktu Habis!" : "Menyimpan..."}
              </h3>
              <p className="text-slate-500 text-sm">
                {isTimeUp 
                  ? "Batas waktu pengerjaan tes ini telah habis. Sistem sedang menyimpan jawaban Anda secara otomatis..."
                  : "Mohon tunggu sebentar, sistem sedang memproses dan menyimpan jawaban Anda."}
              </p>
           </div>
        </div>
      )}
    </div>
  );
}
