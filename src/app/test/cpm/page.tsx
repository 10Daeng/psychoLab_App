"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Question = {
  id: string;
  problemImage: string;
  options: string[];
  text?: string;
};

// Tipe log hasil
type ResultLog = {
  questionId: string;
  firstAttemptAnswer: number;
  firstAttemptTimeMs: number;
  isFirstAttemptCorrect: boolean;
  secondAttemptAnswer: number | null;
  secondAttemptTimeMs: number | null;
  isSecondAttemptCorrect: boolean | null;
};

export default function CPMTestPage() {
  const router = useRouter();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [resultsLog, setResultsLog] = useState<ResultLog[]>([]);
  const resultsLogRef = useRef<ResultLog[]>([]); // Ref to hold latest state for timeouts
  
  const [optionsLocked, setOptionsLocked] = useState(false);
  
  // Timer total
  const [totalTime, setTotalTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Validasi session
    const participantStr = sessionStorage.getItem("client_data");
    const tokenId = sessionStorage.getItem("current_token_id");
    
    if (!participantStr || !tokenId) {
      alert("Sesi tidak valid. Silakan verifikasi ulang token Anda.");
      router.push("/");
      return;
    }

    // Load soal via API aman
    fetch("/api/test/questions?code=CPM")
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setQuestions(data);
        setIsLoaded(true);
        setQuestionStartTime(Date.now());
        
        // Start total timer
        timerRef.current = setInterval(() => {
          setTotalTime(prev => prev + 1);
        }, 1000);
      })
      .catch(err => {
        console.error("Gagal memuat soal", err);
      });


    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [router]);


  const handleAnswerClick = (selectedIndex: number) => {
    if (optionsLocked) return;

    const currentQuestion = questions[currentIndex];
    const clickTime = Date.now();
    const timeTaken = clickTime - questionStartTime;
    setOptionsLocked(true);

    const logEntry: ResultLog = {
      questionId: currentQuestion.id,
      firstAttemptAnswer: selectedIndex,
      firstAttemptTimeMs: timeTaken,
      isFirstAttemptCorrect: false, // Akan dinilai di backend
      secondAttemptAnswer: null,
      secondAttemptTimeMs: null,
      isSecondAttemptCorrect: null,
    };
    
    const newLogs = [...resultsLogRef.current, logEntry];
    resultsLogRef.current = newLogs;
    setResultsLog(newLogs);

    // Animasi klik sebelum lanjut
    setTimeout(() => {
      loadNextQuestion();
    }, 500);
  };


  const loadNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      const updateState = () => {
        setCurrentIndex(prev => prev + 1);
        setOptionsLocked(false);
        setQuestionStartTime(Date.now());
      };

      // Native View Transitions API for smooth question changes
      if (document.startViewTransition) {
        document.startViewTransition(() => {
          // ensure DOM updates synchronously in this callback
          updateState();
        });
      } else {
        updateState();
      }
    } else {
      finishTest();
    }
  };

  const finishTest = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    try {
      // Simpan menggunakan state dari ref yang paling update
      sessionStorage.setItem("cpmGameResults", JSON.stringify(resultsLogRef.current));
      sessionStorage.setItem("cpmTotalTime", totalTime.toString());
      
      router.push("/test/cpm/finish");
      
    } catch (err) {
      console.error("Gagal memproses hasil", err);
      alert("Gagal menyimpan hasil.");
    }
  };

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

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    let cleanPath = path.replace(/^\/+/, '');
    if (!cleanPath.includes('/')) {
      return `/images/${cleanPath}`;
    }
    return `/${cleanPath}`;
  };

  const currentQ = questions[currentIndex];
  const progressPercent = ((currentIndex) / questions.length) * 100;

  return (
    <main className="min-h-screen bg-slate-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between z-10 shrink-0">
        <div className="font-mono text-xl font-bold text-slate-800 w-24">
          {Math.floor(totalTime / 60).toString().padStart(2, '0')}:{(totalTime % 60).toString().padStart(2, '0')}
        </div>
        
        <div className="flex-grow mx-8">
          <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-500 ease-out" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </header>

      {/* Konten Tes */}
      <div className="flex-grow flex flex-col p-4 md:p-8 overflow-y-auto">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 h-full max-w-7xl mx-auto w-full">
          {/* Kolom Soal */}
          <div className="flex flex-col bg-white rounded-3xl shadow-sm border border-slate-200 p-6" style={{ viewTransitionName: 'question-container' }}>
            <h2 className="text-xl font-bold text-slate-700 mb-4">{currentQ.text}</h2>
            <div className="flex-grow flex items-center justify-center bg-slate-50 border-4 border-dashed border-blue-100 rounded-2xl p-4 min-h-[250px] md:min-h-[300px]">
              <img 
                src={getImageUrl(currentQ.problemImage)} 
                alt="Problem Pattern" 
                className="max-w-full max-h-[40vh] md:max-h-[50vh] object-contain drop-shadow-md"
                style={{ viewTransitionName: 'problem-image' }}
              />
            </div>
          </div>

          {/* Kolom Pilihan */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col" style={{ viewTransitionName: 'options-container' }}>
            <h3 className="text-lg font-semibold text-slate-600 mb-4 text-center">Pilih pola yang tepat:</h3>
          <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 flex-grow content-center ${optionsLocked ? 'pointer-events-none opacity-80' : ''}`}>
            {currentQ.options.map((opt, idx) => (
              <div 
                key={idx}
                onClick={() => handleAnswerClick(idx)}
                className="aspect-square bg-slate-50 border-2 border-slate-200 rounded-2xl overflow-hidden cursor-pointer hover:border-blue-400 hover:shadow-lg hover:-translate-y-1 transition-all flex items-center justify-center p-2"
              >
                <img src={getImageUrl(opt)} alt={`Option ${idx+1}`} className="max-w-full max-h-full object-contain drop-shadow-sm" />
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </main>
  );
}
