"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ConfirmBiodata() {
  const router = useRouter();
  const [clientData, setClientData] = useState<any>(null);

  useEffect(() => {
    const data = sessionStorage.getItem("client_data");
    if (data) {
      setClientData(JSON.parse(data));
    } else {
      router.push("/");
    }
  }, [router]);

  const handleLanjut = async () => {
    // 1. Panggil API untuk membuat test_results (mulai sesi tes)
    const res = await fetch("/api/start-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        token_id: sessionStorage.getItem("current_token_id"),
        client_id: clientData.id,
        test_code: sessionStorage.getItem("test_code")
      }),
    });
    const data = await res.json();
    
    if (res.ok) {
      sessionStorage.setItem("test_result_id", data.test_result_id);
      router.push("/test/instruction");
    } else {
      alert("Gagal memulai sesi tes: " + data.error);
    }
  };

  if (!clientData) return <div className="p-10 text-center">Memuat data...</div>;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/80 p-8 rounded-3xl shadow-xl">
        <h1 className="text-2xl font-bold mb-6 text-center">Konfirmasi Data Anda</h1>
        
        <div className="space-y-4 mb-8 bg-slate-50 p-6 rounded-xl border border-slate-200 text-sm">
          <p><strong>Nama:</strong> {clientData.name}</p>
          <p><strong>Tanggal Lahir:</strong> {clientData.birth_date}</p>
          <p><strong>Jenis Kelamin:</strong> {clientData.gender}</p>
          <p><strong>Sekolah:</strong> {clientData.school_or_institution}</p>
          <p><strong>Kelas:</strong> {clientData.grade}</p>
        </div>

        <button 
          onClick={handleLanjut}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl"
        >
          Ya, Data Sudah Benar
        </button>
        <button 
          onClick={() => router.push("/biodata?edit=true")}
          className="w-full mt-3 text-slate-500 hover:text-slate-800 py-2 text-sm font-medium"
        >
          Ada kesalahan data? Edit Biodata
        </button>
      </div>
    </main>
  );
}
