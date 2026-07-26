"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CPMFinishPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"saving" | "success" | "error">("saving");
  const [errorMessage, setErrorMessage] = useState("");
  const [parentToken, setParentToken] = useState<string | null>(null);

  useEffect(() => {
    const saveResults = async () => {
      try {
        const testResultId = sessionStorage.getItem("test_result_id");
        const resultsLogStr = sessionStorage.getItem("cpmGameResults");
        const totalTime = sessionStorage.getItem("cpmTotalTime");

        if (!testResultId || !resultsLogStr) {
          throw new Error("Data hasil tidak lengkap atau sesi berakhir.");
        }

        const payload = {
          test_result_id: testResultId,
          resultsLog: JSON.parse(resultsLogStr),
          totalTime: totalTime || "0"
        };

        const res = await fetch("/api/save-result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Gagal menyimpan hasil ke server");
        }

        // Simpan parent_token ke session storage untuk halaman selesai
        if (data.parent_token) {
          sessionStorage.setItem("parent_token_code", data.parent_token);
        }

        // Bersihkan session
        sessionStorage.removeItem("client_data");
        sessionStorage.removeItem("current_token_id");
        sessionStorage.removeItem("test_result_id");
        sessionStorage.removeItem("cpmGameResults");
        sessionStorage.removeItem("cpmTotalTime");

        // Redirect ke halaman selesai premium
        router.push("/selesai");
      } catch (err: any) {
        console.error(err);
        setErrorMessage(err.message);
        setStatus("error");
      }
    };

    saveResults();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-xl text-center border border-slate-100">
        
        {status === "saving" && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Menyimpan Hasil...</h1>
            <p className="text-slate-500">Mohon tunggu, jangan tutup halaman ini.</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center animate-fade-in-up">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner">
              ✓
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-4">Tes Selesai!</h1>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Selamat, Anda telah menyelesaikan seluruh tes dengan baik.
            </p>
            
            {parentToken && (
              <div className="w-full bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-8 text-left">
                <p className="text-sm font-semibold text-blue-800 mb-2">Pesan Penting:</p>
                <p className="text-sm text-slate-700 mb-4">
                  Mohon berikan KODE PENDAMPING berikut kepada Orang Tua / Wali Anda untuk mengisi kuesioner observasi:
                </p>
                <div className="bg-white border-2 border-dashed border-blue-400 py-3 rounded-xl text-center text-2xl font-black text-blue-700 tracking-widest">
                  {parentToken}
                </div>
              </div>
            )}

            <button 
              onClick={() => router.push("/")}
              className="px-8 py-3 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
            >
              Kembali ke Beranda
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner">
              !
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Terjadi Kesalahan</h1>
            <p className="text-red-600 mb-6 bg-red-50 p-4 rounded-lg text-sm border border-red-200">
              {errorMessage}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-200"
            >
              Coba Simpan Ulang
            </button>
          </div>
        )}

      </div>
    </main>
  );
}
