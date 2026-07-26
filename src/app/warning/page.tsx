"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Clock, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

export default function WarningPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tokenType, setTokenType] = useState<string | null>(null);

  useEffect(() => {
    // Pastikan user berasal dari halaman login (memiliki session)
    const type = sessionStorage.getItem("token_type");
    const tokenId = sessionStorage.getItem("current_token_id");
    
    if (!type || !tokenId) {
      router.replace("/");
    } else {
      setTokenType(type);
    }
  }, [router]);

  const handleLanjut = async () => {
    setLoading(true);
    setError("");
    const tokenId = sessionStorage.getItem("current_token_id");

    try {
      // Panggil API untuk mengunci token
      const res = await fetch("/api/use-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token_id: tokenId }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal mengaktifkan token");
      }

      // Jika berhasil, arahkan ke biodata
      if (tokenType === "CLOSED") {
        router.push("/biodata/confirm");
      } else {
        router.push("/biodata");
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white/90 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl shadow-blue-900/5 border border-amber-500/30"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-amber-100 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <ShieldAlert className="w-10 h-10 text-amber-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">Perhatian Sebelum Memulai</h1>
          <p className="text-slate-500">Mohon baca aturan berikut sebelum Anda melanjutkan ke pengisian biodata dan tes.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm text-center">
            {error}
          </div>
        )}

        <div className="space-y-6 mb-8">
          <div className="flex gap-4 p-5 bg-blue-50/80 rounded-2xl border border-blue-100 items-start">
            <AlertTriangle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Token Berlaku 1x Pemakaian</h3>
              <p className="text-sm text-blue-800/80 leading-relaxed">
                Token yang Anda masukkan hanya berlaku <strong>satu kali</strong>. Setelah Anda menekan tombol Lanjut, token ini akan terikat pada sesi Anda dan tidak dapat digunakan lagi oleh orang lain atau di perangkat lain.
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-5 bg-amber-50/80 rounded-2xl border border-amber-100 items-start">
            <Clock className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-1">Waktu Mengerjakan Tes</h3>
              <p className="text-sm text-amber-800/80 leading-relaxed">
                Ketika masuk ke dalam sistem, Anda <strong>harus menyelesaikan tes hingga selesai</strong>. Waktu pengerjaan akan dihitung oleh sistem. Pastikan koneksi internet dan baterai perangkat Anda mencukupi.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.replace("/")}
            disabled={loading}
            className="flex-1 px-6 py-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all text-center disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleLanjut}
            disabled={loading}
            className="flex-1 px-6 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 transition-all text-center disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Saya Mengerti, Lanjut"}
          </button>
        </div>
      </motion.div>
    </main>
  );
}
