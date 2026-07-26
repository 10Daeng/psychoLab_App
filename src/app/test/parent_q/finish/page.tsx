"use client";

import { useRouter } from "next/navigation";

export default function ParentQFinish() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-xl text-center border border-slate-100">
        <div className="flex flex-col items-center animate-fade-in-up">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner">
            ✓
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-4">Terima Kasih!</h1>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Observasi Anda sangat berharga. Data ini akan membantu psikolog kami untuk memahami potensi dan kebiasaan anak secara utuh.
          </p>
          <button 
            onClick={() => router.push("/")}
            className="px-8 py-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg"
          >
            Selesai
          </button>
        </div>
      </div>
    </main>
  );
}
