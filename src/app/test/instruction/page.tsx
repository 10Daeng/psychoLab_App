"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function InstructionPage() {
  const router = useRouter();
  const [clientName, setClientName] = useState("");

  useEffect(() => {
    const data = sessionStorage.getItem("client_data");
    if (data) {
      setClientName(JSON.parse(data).name);
    }
  }, []);

  const startTest = () => {
    const testCode = sessionStorage.getItem("test_code")?.toLowerCase() || "cpm";
    router.push(`/test/${testCode}`);
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white p-10 rounded-3xl shadow-xl text-center">
        <h1 className="text-3xl font-bold mb-4">Halo, {clientName || "Peserta"}! 👋</h1>
        <p className="text-lg text-slate-600 mb-8">
          Selamat datang di halaman tes psikologi. Sebelum kita mulai, perhatikan instruksi berikut:
        </p>

        <div className="text-left bg-blue-50 border border-blue-100 p-6 rounded-2xl mb-8 text-blue-900 space-y-4">
          <p className="font-semibold text-lg">📝 Aturan Mengerjakan:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Kamu akan melihat sebuah pola gambar besar yang memiliki bagian kosong.</li>
            <li>Di bawahnya, ada 6 pilihan potongan gambar.</li>
            <li>Tugasmu adalah memilih 1 potongan gambar yang paling tepat untuk mengisi bagian yang kosong tersebut.</li>
            <li>Kerjakan dengan teliti namun jangan terlalu lama terpaku pada satu soal.</li>
            <li>Waktu tes akan mulai dihitung begitu kamu menekan tombol di bawah.</li>
          </ul>
        </div>

        <button 
          onClick={startTest}
          className="bg-green-500 hover:bg-green-600 text-white text-xl font-bold py-4 px-12 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          🚀 Mulai Tes Sekarang
        </button>
      </div>
    </main>
  );
}
