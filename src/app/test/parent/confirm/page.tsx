"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ParentConfirmPage() {
  const router = useRouter();
  const [clientData, setClientData] = useState<any>(null);
  const [tokenCode, setTokenCode] = useState("");

  useEffect(() => {
    const dataStr = sessionStorage.getItem("client_data");
    const tCode = sessionStorage.getItem("token_code");
    
    if (!dataStr || !tCode) {
      alert("Sesi tidak valid atau telah berakhir.");
      router.push("/");
      return;
    }
    
    try {
      setClientData(JSON.parse(dataStr));
      setTokenCode(tCode);
    } catch (e) {
      console.error(e);
      router.push("/");
    }
  }, [router]);

  if (!clientData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Format tanggal lahir
  let formattedDOB = "Tidak diketahui";
  if (clientData.birth_date) {
    formattedDOB = new Date(clientData.birth_date).toLocaleDateString("id-ID", {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  const handleContinue = async () => {
    try {
      const res = await fetch("/api/start-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token_id: sessionStorage.getItem("current_token_id"),
          client_id: clientData.id,
          test_code: "PARENT_Q"
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memulai sesi");
      
      sessionStorage.setItem("test_result_id", data.test_result_id);
      router.push("/test/parent_q");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const csMessage = encodeURIComponent(`Halo Admin, saya mencoba memasukkan Kode Token ${tokenCode} untuk Kuesioner Orang Tua, namun data anak yang muncul tidak sesuai. Mohon bantuannya.`);
  const waLink = `https://wa.me/628111222333?text=${csMessage}`; // Sesuaikan nomor CS

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl">
            👨‍👩‍👧
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Konfirmasi Data Anak</h1>
          <p className="text-slate-600">
            Apakah Anda bertindak sebagai Orang Tua/Wali dari ananda dengan data berikut?
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8 space-y-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Lengkap</p>
            <p className="font-semibold text-slate-800 text-lg">{clientData.name || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tanggal Lahir</p>
            <p className="font-medium text-slate-700">{formattedDOB}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Asal Sekolah</p>
            <p className="font-medium text-slate-700">{clientData.target_institution || clientData.school || "-"}</p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleContinue}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-200"
          >
            Ya, Lanjut Pengisian
          </button>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold py-4 rounded-xl transition-colors"
          >
            Tidak, Konfirmasi ke Admin
          </a>
        </div>
      </div>
    </main>
  );
}
