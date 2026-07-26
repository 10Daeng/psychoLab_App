"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function QuestionnaireFormPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const qCode = params.code;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [questionnaire, setQuestionnaire] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  const [currentPage, setCurrentPage] = useState(1);
  const [progressId, setProgressId] = useState<string | null>(null);
  
  const [clientData, setClientData] = useState<any>(null);
  const [tokenId, setTokenId] = useState<string>("");

  const QUESTIONS_PER_PAGE = 20;

  useEffect(() => {
    const dataStr = sessionStorage.getItem("client_data");
    const tId = sessionStorage.getItem("current_token_id");
    
    if (!dataStr || !tId) {
      alert("Sesi tidak valid.");
      router.push("/");
      return;
    }
    
    const parsedClient = JSON.parse(dataStr);
    setClientData(parsedClient);
    setTokenId(tId);

    // Hitung umur anak dalam bulan (untuk filter CBCL)
    let childAgeMonths = 0;
    if (parsedClient.birth_date) {
      const birthDate = new Date(parsedClient.birth_date);
      const today = new Date();
      childAgeMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
    }

    const loadData = async () => {
      try {
        // 1. Ambil kuesioner
        const { data: qData, error: qErr } = await supabase
          .from("questionnaires")
          .select("*")
          .eq("code", qCode)
          .single();
          
        if (qErr || !qData) throw new Error("Kuesioner tidak ditemukan.");
        setQuestionnaire(qData);

        // 2. Ambil soal
        const { data: qsData, error: qsErr } = await supabase
          .from("questions")
          .select("*")
          .eq("questionnaire_id", qData.id)
          .order("question_number", { ascending: true });
          
        if (qsErr) throw qsErr;
        setQuestions(qsData || []);

        // 3. Ambil jawaban sebelumnya jika ada
        const { data: respData } = await supabase
          .from("questionnaire_responses")
          .select("question_id, answer_value")
          .eq("token_id", tId)
          .eq("questionnaire_id", qData.id);

        const initialAnswers: Record<string, string> = {};
        if (respData) {
          respData.forEach((r: any) => {
            initialAnswers[r.question_id] = r.answer_value;
          });
        }
        setAnswers(initialAnswers);

        // 4. Ambil atau buat progress
        const { data: progData } = await supabase
          .from("questionnaire_progress")
          .select("*")
          .eq("token_id", tId)
          .eq("questionnaire_id", qData.id)
          .single();

        if (progData) {
          setProgressId(progData.id);
          // Jika belum selesai, arahkan ke last_page
          if (progData.status === 'in_progress' && progData.last_page > 1) {
            setCurrentPage(progData.last_page);
          }
        } else {
          // Buat record progress baru
          const { data: newProg } = await supabase
            .from("questionnaire_progress")
            .insert({
              token_id: tId,
              client_id: parsedClient.id,
              questionnaire_id: qData.id,
              total_questions: qData.total_questions,
              status: "in_progress",
              last_page: 1
            })
            .select()
            .single();
            
          if (newProg) setProgressId(newProg.id);
        }

      } catch (err) {
        console.error(err);
        alert("Gagal memuat kuesioner.");
        router.push("/test/parent/dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [qCode, router]);

  // Pagination logic
  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE;
  const currentQuestions = questions.slice(startIndex, startIndex + QUESTIONS_PER_PAGE);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSaveAndNext = async () => {
    // Validasi: pastikan semua soal di halaman ini terjawab
    const unanswered = currentQuestions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      alert(`Ada ${unanswered.length} soal yang belum dijawab di halaman ini.`);
      return;
    }

    setSaving(true);
    try {
      // 1. Simpan jawaban halaman ini
      const upsertData = currentQuestions.map(q => ({
        token_id: tokenId,
        client_id: clientData.id,
        questionnaire_id: questionnaire.id,
        question_id: q.id,
        answer_value: answers[q.id]
      }));

      const { error: upsertErr } = await supabase
        .from("questionnaire_responses")
        .upsert(upsertData, { onConflict: "token_id,question_id" });

      if (upsertErr) throw upsertErr;

      // Hitung total terjawab keseluruhan
      const totalAnswered = Object.keys(answers).length;
      const isCompleted = currentPage === totalPages;

      // 2. Update Progress
      if (progressId) {
        await supabase
          .from("questionnaire_progress")
          .update({
            answered_questions: totalAnswered,
            last_page: isCompleted ? currentPage : currentPage + 1,
            status: isCompleted ? "completed" : "in_progress",
            updated_at: new Date().toISOString()
          })
          .eq("id", progressId);
      }

      if (isCompleted) {
        // Kembali ke dashboard jika selesai
        router.push("/test/parent/dashboard");
      } else {
        // Lanjut halaman berikutnya
        setCurrentPage(prev => prev + 1);
        window.scrollTo(0, 0);
      }
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan jawaban. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const parseOptions = (optionsStr: string) => {
    // Format: "0=Tidak Pernah, 1=Kadang, 2=Sering"
    try {
      return optionsStr.split(',').map(part => {
        const [val, label] = part.split('=');
        return { value: val?.trim(), label: label?.trim() };
      });
    } catch (e) {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8 pb-32">
      <div className="max-w-4xl mx-auto">
        <header className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{questionnaire?.code}</h1>
              <p className="text-slate-600">{questionnaire?.title}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-blue-600 mb-1">
                Halaman {currentPage} dari {totalPages}
              </p>
              <p className="text-xs text-slate-500">Total: {questions.length} Pertanyaan</p>
            </div>
          </div>
        </header>

        <div className="space-y-4">
          {currentQuestions.map((q, idx) => {
            const options = parseOptions(q.response_options);
            const globalIndex = startIndex + idx + 1;
            
            return (
              <div key={q.id} className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 transition-all hover:border-blue-300">
                <div className="flex gap-4">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm">
                    {globalIndex}
                  </div>
                  <div className="flex-grow">
                    <p className="text-slate-800 font-medium text-lg mb-4">{q.question_text}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      {options.map((opt) => {
                        const isSelected = answers[q.id] === opt.value;
                        return (
                          <label 
                            key={opt.value} 
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all text-center
                              \${isSelected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
                          >
                            <input 
                              type="radio" 
                              name={`question_\${q.id}`} 
                              value={opt.value}
                              checked={isSelected}
                              onChange={() => handleAnswerChange(q.id, opt.value)}
                              className="sr-only" 
                            />
                            <span className="text-xs font-bold uppercase mb-1 opacity-50">{opt.value}</span>
                            <span className="text-sm font-semibold">{opt.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <button 
            onClick={() => router.push("/test/parent/dashboard")}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors hidden sm:block"
          >
            Kembali ke Dashboard
          </button>
          
          <div className="flex-grow hidden md:block mx-8">
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-500" 
                style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
              ></div>
            </div>
            <p className="text-center text-xs text-slate-500 mt-2 font-medium">
              Terjawab: {Object.keys(answers).length} dari {questions.length}
            </p>
          </div>

          <button 
            onClick={handleSaveAndNext}
            disabled={saving}
            className="flex-grow sm:flex-grow-0 px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all whitespace-nowrap"
          >
            {saving ? "⏳ Menyimpan..." : (currentPage === totalPages ? "Kirim & Selesai" : "Simpan & Lanjut ➔")}
          </button>
        </div>
      </div>
    </main>
  );
}
