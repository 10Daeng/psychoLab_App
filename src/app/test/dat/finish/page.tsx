"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { processDatScore } from "@/lib/engines/dat";

export default function DATFinishPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Menyimpan hasil...");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    async function submitResults() {
      try {
        const tokenId = sessionStorage.getItem("current_token_id");
        const clientDataStr = sessionStorage.getItem("client_data");
        const rawAnswersStr = sessionStorage.getItem("datResults");
        
        if (!tokenId || !clientDataStr || !rawAnswersStr) {
          throw new Error("Data sesi tidak lengkap");
        }
        
        const rawAnswers = JSON.parse(rawAnswersStr);
        
        // Calculate scores using DAT engine
        const calculatedScore = processDatScore(rawAnswers);
        
        const payload = {
          token_id: tokenId,
          test_code: "DAT",
          raw_answers: rawAnswers,
          calculated_score: calculatedScore,
        };
        
        const res = await fetch("/api/save-result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error);
        
        setStatus("Berhasil! Hasil DAT Anda telah tersimpan.");
        
        // Bersihkan sesi ujian
        sessionStorage.removeItem("datResults");
        
        setTimeout(() => {
          router.push("/test/success");
        }, 2000);
        
      } catch (err: any) {
         setIsError(true);
         setStatus("Gagal menyimpan hasil: " + err.message);
      }
    }
    
    submitResults();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
       <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-lg border border-slate-200 text-center">
          {isError ? (
             <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-red-500 text-3xl font-bold">X</span>
             </div>
          ) : status.includes("Berhasil") ? (
             <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
             </div>
          ) : (
             <div className="w-20 h-20 border-4 border-blue-50 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
          )}
          
          <h2 className="text-xl font-bold text-slate-800 mb-2">{status}</h2>
          <p className="text-slate-500 text-sm">Mohon jangan tutup halaman ini...</p>
       </div>
    </div>
  );
}
