"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ArrowRight, ArrowLeft, Home } from "lucide-react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

const steps = [
  { id: 1, title: "Riwayat Perkembangan Singkat", code: "DEV_HISTORY", estimatedTime: "4 menit" },
  { id: 2, title: "Checklist Kesiapan Sekolah", code: "SCHOOL_READY", estimatedTime: "6 menit" },
  { id: 3, title: "Strengths & Difficulties (SDQ)", code: "SDQ", estimatedTime: "6 menit" },
  { id: 4, title: "Skrining Kebiasaan Tidur", code: "SLEEP_SCREEN", estimatedTime: "2 menit" },
];

export default function ParentQuestionnaireFlow() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [prtToken, setPrtToken] = useState("");
  const [chiToken, setChiToken] = useState("");
  const [childName, setChildName] = useState("");

  useEffect(() => {
    const token = sessionStorage.getItem("token_code");
    const chiId = sessionStorage.getItem("paired_chi_token");

    if (token?.startsWith("PRT-")) {
      setPrtToken(token);
    }
    if (chiId) {
      setChiToken(chiId);
    }

    // Get child name from session if available
    const storedChild = sessionStorage.getItem("child_name");
    if (storedChild) setChildName(storedChild);
  }, []);

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit all answers
      setLoading(true);
      try {
        const prtTokenId = sessionStorage.getItem("current_token_id");
        const responses = Object.entries(answers).map(([key, value]) => ({
          prt_token_id: prtTokenId,
          chi_token_id: sessionStorage.getItem("paired_chi_token"),
          questionnaire_code: steps[currentStep].code,
          question_code: key,
          answer_value: String(value)
        }));

        const { error } = await supabase
          .from('parent_responses')
          .insert(responses);

        if (error) throw error;

        await supabase
          .from('parent_progress')
          .upsert({
            prt_token_id: prtTokenId,
            chi_token_id: sessionStorage.getItem("paired_chi_token"),
            completed_questionnaires: steps.map(s => s.code),
            status: 'completed',
            completed_at: new Date().toISOString()
          });

        toast.success("Terima kasih! Jawaban Anda telah tersimpan.");
        router.push("/test/parent/complete");
      } catch (err: any) {
        toast.error("Gagal menyimpan jawaban. Silakan coba lagi.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-2xl">👨‍👩‍👧</div>
            <div>
              <div className="font-semibold text-lg">Untuk Orang Tua dari {childName || "Anak"}</div>
              <div className="text-xs text-slate-500">Token: {prtToken}</div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-emerald-600 font-medium">Sedang Mengisi</span>
            </div>
            <button
              onClick={() => router.push("/")}
              className="text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              <Home className="w-4 h-4" /> Keluar
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-slate-100">
          <div
            className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-3xl shadow-xl p-10"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <div className="text-emerald-600 text-sm font-semibold tracking-widest">
                  LANGKAH {currentStep + 1} DARI {steps.length}
                </div>
                <h1 className="text-3xl font-bold text-slate-800 mt-1">
                  {steps[currentStep].title}
                </h1>
                <p className="text-slate-500 mt-2">{steps[currentStep].estimatedTime}</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">UNTUK ORANG TUA</div>
                <div className="text-4xl mt-1">👪</div>
              </div>
            </div>

            {/* Form content would go here based on currentStep */}
            <div className="min-h-[420px] flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl">
              <div className="text-center">
                <div className="text-6xl mb-6">📋</div>
                <p className="text-xl text-slate-600 font-medium">
                  Form {steps[currentStep].title} akan ditampilkan di sini
                </p>
                <p className="text-sm text-slate-500 mt-3 max-w-xs mx-auto">
                  Form ini dirancang ramah, mudah dipahami, dan membutuhkan waktu sekitar {steps[currentStep].estimatedTime}
                </p>
              </div>
            </div>

            <div className="flex justify-between mt-10">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-8 py-4 text-slate-600 disabled:opacity-40 hover:bg-slate-100 rounded-2xl transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
                Kembali
              </button>

              <button
                onClick={handleNext}
                disabled={loading}
                className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-2xl font-semibold transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-70"
              >
                {currentStep === steps.length - 1 ? "Kirim Semua Jawaban" : "Lanjut ke Langkah Berikutnya"}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
