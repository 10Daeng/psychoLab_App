"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ParentDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [questionnaires, setQuestionnaires] = useState<any[]>([]);
  const [clientData, setClientData] = useState<any>(null);
  const [tokenId, setTokenId] = useState<string>("");

  useEffect(() => {
    const dataStr = sessionStorage.getItem("client_data");
    const tCode = sessionStorage.getItem("token_code");
    const tId = sessionStorage.getItem("current_token_id");
    
    if (!dataStr || !tCode || !tId) {
      alert("Sesi tidak valid atau telah berakhir.");
      router.push("/");
      return;
    }
    
    setClientData(JSON.parse(dataStr));
    setTokenId(tId);

    const fetchQuestionnaires = async () => {
      try {
        const res = await fetch(`/api/test/parent/dashboard?tokenId=${tId}`);
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error);

        const { questionnaires: qData, progress: progData } = data;

        const merged = qData.map((q: any) => {
          const progress = progData?.find((p: any) => p.questionnaire_id === q.id);
          return {
            ...q,
            progress: progress || { status: "not_started", answered_questions: 0 }
          };
        });

        setQuestionnaires(merged);
      } catch (e: any) {
        console.error("Gagal memuat kuesioner:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionnaires();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium animate-pulse">Menyiapkan Kuesioner...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">Formulir Orang Tua</h1>
          <p className="text-slate-600">
            Berikut adalah daftar kuesioner yang perlu Anda isi untuk melengkapi profil <span className="font-semibold text-blue-700">{clientData?.name}</span>. 
            Anda dapat beristirahat sejenak di antara kuesioner.
          </p>
        </header>

        <div className="space-y-4">
          {questionnaires.map((q) => {
            const isCompleted = q.progress.status === "completed";
            const isInProgress = q.progress.status === "in_progress";
            
            return (
              <div key={q.id} className={`bg-white p-6 rounded-2xl border transition-all ${isCompleted ? 'border-green-200 shadow-sm' : 'border-slate-200 shadow-md hover:border-blue-300'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold text-slate-800">{q.code}</h2>
                      {isCompleted && <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">Selesai</span>}
                      {isInProgress && <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded">Dilanjutkan</span>}
                    </div>
                    <p className="text-sm font-medium text-slate-700 mb-1">{q.title}</p>
                    <p className="text-xs text-slate-500">{q.description}</p>
                  </div>
                  
                  <div className="shrink-0 flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-400 font-medium mb-1">Progres</p>
                      <p className="text-sm font-bold text-slate-700">{q.progress.answered_questions} / {q.total_questions}</p>
                    </div>
                    
                    {!isCompleted ? (
                      <button 
                        onClick={() => router.push(`/test/parent/form/${q.code}`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 transition-all whitespace-nowrap"
                      >
                        {isInProgress ? 'Lanjutkan' : 'Mulai Isi'}
                      </button>
                    ) : (
                      <button 
                        disabled
                        className="bg-slate-100 text-slate-400 px-5 py-2.5 rounded-xl text-sm font-bold border border-slate-200 cursor-not-allowed whitespace-nowrap flex items-center gap-2"
                      >
                        ✓ Selesai
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`} 
                    style={{ width: `${Math.min(100, Math.round((q.progress.answered_questions / q.total_questions) * 100))}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Tombol Selesai Semua */}
        {questionnaires.every(q => q.progress.status === 'completed') && (
          <div className="mt-8 text-center animate-fade-in-up">
             <button 
              onClick={() => router.push("/test/cpm/finish")} // Route ke finish standar
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl text-base font-bold shadow-xl shadow-green-200 transition-all"
             >
               Selesaikan Seluruh Sesi
             </button>
          </div>
        )}

      </div>
    </main>
  );
}
