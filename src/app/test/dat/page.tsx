"use client";

import { useEffect, useState, useRef } from "react";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useRouter } from "next/navigation";
import { Clock, AlertTriangle, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

const DAT_SUBTESTS = [
  { id: "VERBAL", name: "Verbal Reasoning", timeLimitSeconds: 60, questions: [
      { id: "V1", text: "Panas : Api = Dingin : ...", options: ["Air", "Es", "Angin", "Salju", "Hujan"] },
      { id: "V2", text: "Besar : Kecil = Tinggi : ...", options: ["Rendah", "Panjang", "Lebar", "Dalam", "Pendek"] }
    ]
  },
  { id: "NUMERICAL", name: "Numerical Ability", timeLimitSeconds: 60, questions: [
      { id: "N1", text: "2, 4, 6, 8, ...", options: ["9", "10", "11", "12", "14"] },
      { id: "N2", text: "Jika 3x = 15, maka x = ?", options: ["3", "4", "5", "6", "7"] }
    ]
  },
  { id: "ABSTRACT", name: "Abstract Reasoning", timeLimitSeconds: 60, questions: [
      { id: "A1", text: "Pilih bentuk selanjutnya (Simulasi Gambar)", options: ["A", "B", "C", "D", "E"] },
    ]
  }
];

export default function DATTestPage() {
  const router = useRouter();
  const [currentSubtestIndex, setCurrentSubtestIndex, clearSubIndex] = useAutoSave('DAT_SUBINDEX', 0);
  const [currentQuestionIndex, setCurrentQuestionIndex, clearQIndex] = useAutoSave('DAT_QINDEX', 0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [answers, setAnswers, clearAnswers] = useAutoSave<Record<string, Record<string, string>>>('DAT_ANSWERS', {});
  
  const [remainingTime, setRemainingTime] = useState(0);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const participantStr = sessionStorage.getItem("client_data");
    const tokenId = sessionStorage.getItem("current_token_id");
    
    if (!participantStr || !tokenId) {
      alert("Sesi tidak valid. Silakan verifikasi ulang token Anda.");
      router.push("/");
      return;
    }
    
    // Initialize Web Worker Timer
    workerRef.current = new Worker(new URL("/workers/timer.js", window.location.origin));
    workerRef.current.onmessage = (e) => {
      if (e.data.type === "TICK") {
        setRemainingTime(e.data.remainingSeconds);
      } else if (e.data.type === "TIMEOUT") {
        handleTimeout();
      }
    };

    // Remove starting subtest 0 always if loaded from autosave
    // Only start if we are effectively starting fresh or resuming
    // Actually, startSubtest sets index to what we pass, which overrides the autosave!
    // We should NOT call startSubtest(0) unconditionally.
    // Let's just start the timer for the current saved subtest.
    setIsLoaded(true);
    startSubtest(currentSubtestIndex); // this will use the autosaved index if available, but startSubtest sets index again. Wait, if we use the state currentSubtestIndex, it's captured on mount.

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const startSubtest = (index: number, resetQuestion = true) => {
    if (index >= DAT_SUBTESTS.length) {
      finishTest();
      return;
    }
    setCurrentSubtestIndex(index);
    if (resetQuestion) setCurrentQuestionIndex(0);
    const timeLimit = DAT_SUBTESTS[index].timeLimitSeconds;
    setRemainingTime(timeLimit);
    
    workerRef.current?.postMessage({ command: "START", seconds: timeLimit });
  };

  const handleTimeout = () => {
    toast.error(`Waktu untuk ${DAT_SUBTESTS[currentSubtestIndex].name} habis!`, { duration: 3000 });
    setTimeout(() => {
      startSubtest(currentSubtestIndex + 1);
    }, 1500);
  };

  const handleAnswerClick = (option: string) => {
    const subtest = DAT_SUBTESTS[currentSubtestIndex];
    const q = subtest.questions[currentQuestionIndex];
    
    setAnswers(prev => ({
      ...prev,
      [subtest.id]: {
        ...(prev[subtest.id] || {}),
        [q.id]: option
      }
    }));

    if (currentQuestionIndex + 1 < subtest.questions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      workerRef.current?.postMessage({ command: "STOP" });
      startSubtest(currentSubtestIndex + 1);
    }
  };

  const finishTest = async () => {
    workerRef.current?.terminate();
    sessionStorage.setItem("datResults", JSON.stringify(answers));
    
    clearAnswers();
    clearSubIndex();
    clearQIndex();
    
    router.push("/test/dat/finish"); // Will trigger save-result
  };

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center">Memuat...</div>;

  const currentSubtest = DAT_SUBTESTS[currentSubtestIndex];
  if (!currentSubtest) return null;
  const currentQ = currentSubtest.questions[currentQuestionIndex];
  
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = ((currentQuestionIndex) / currentSubtest.questions.length) * 100;

  return (
    <main className="min-h-screen bg-slate-100 flex flex-col overflow-hidden">
      <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between z-10 shrink-0 border-b border-slate-200">
        <div className="flex items-center gap-4">
           <div className="font-bold text-slate-700 bg-slate-100 px-4 py-2 rounded-lg text-sm">
             DAT - {currentSubtest.name}
           </div>
        </div>
        
        <div className="flex-grow mx-8">
          <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>

        <div className={`font-mono text-xl font-bold flex items-center gap-2 px-4 py-2 rounded-xl ${remainingTime <= 10 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-700'}`}>
           <Clock className="w-5 h-5" />
           {formatTime(remainingTime)}
        </div>
      </header>

      <div className="flex-grow flex flex-col p-4 md:p-8 overflow-y-auto items-center justify-center">
        <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-8 w-full max-w-4xl min-h-[400px] flex flex-col">
           <h2 className="text-2xl font-bold text-slate-800 mb-8 text-center">{currentQ.text}</h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-auto">
             {currentQ.options.map((opt, idx) => (
               <button 
                 key={idx}
                 onClick={() => handleAnswerClick(opt)}
                 className="bg-slate-50 border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-700 font-semibold text-lg py-4 px-6 rounded-2xl transition-all"
               >
                 {opt}
               </button>
             ))}
           </div>
        </div>
      </div>
    </main>
  );
}
