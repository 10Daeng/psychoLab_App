"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/verify-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Token tidak valid");
      }

      // Simpan konteks token sementara di session storage
      sessionStorage.setItem("current_token_id", data.token_id);
      sessionStorage.setItem("token_code", token.toUpperCase());
      sessionStorage.setItem("test_code", data.test_code);
      sessionStorage.setItem("token_type", data.type); // Disimpan untuk dipakai di halaman warning

      if (data.type === "CLOSED") {
        sessionStorage.setItem("client_data", JSON.stringify(data.client));
      }

      // Jalur khusus Kuesioner Orang Tua
      if (token.toUpperCase().startsWith("PRT-")) {
        router.push("/test/parent/confirm");
        return;
      }

      // Jika token sudah digunakan sebelumnya (klien terputus / reload)
      if (data.status === "IN_PROGRESS") {
        if (data.type === "CLOSED") {
          router.push("/biodata/confirm");
        } else {
          router.push("/biodata");
        }
      } else {
        // Token baru, arahkan ke halaman peringatan sebelum mengisi biodata
        router.push("/warning");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl shadow-blue-900/5 border border-white/50">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <span className="text-2xl text-white">🎓</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">
            Lentera Batin Assessment
          </h1>
          <p className="text-slate-500">Masukkan kode token LENTERA Anda.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <input
              type="text"
              id="token"
              name="token"
              required
              className="peer w-full p-4 pt-6 pb-2 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-blue-500 uppercase tracking-widest transition-all bg-transparent outline-none text-slate-800 font-semibold placeholder-transparent text-center text-xl"
              placeholder="KODE TOKEN"
              value={token}
              onChange={(e) => setToken(e.target.value.toUpperCase())}
            />
            <label
              htmlFor="token"
              className="absolute left-0 right-0 text-center top-2 text-xs font-bold text-slate-400 uppercase tracking-wider transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-4 peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-xs peer-focus:font-bold peer-focus:text-blue-600 pointer-events-none"
            >
              Kode Token
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !token}
            className="relative w-full overflow-hidden group bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-200 mt-4"
          >
            <span className="relative z-10">
              {loading ? "Memverifikasi..." : "Lanjutkan"}
            </span>
            <div className="absolute inset-0 h-full w-full bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-xl"></div>
          </button>
        </form>

        <p className="mt-8 text-xs text-center text-slate-400">
          Aplikasi ini adalah alat bantu asesmen internal.
          <br />
          Hasil akan ditafsirkan oleh psikolog berwenang.
        </p>
      </div>
    </main>
  );
}
