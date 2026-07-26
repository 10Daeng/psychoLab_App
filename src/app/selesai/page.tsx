"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Home, Star, Clock, Award } from "lucide-react";

// Konfeti sederhana menggunakan CSS animations
const ConfettiPiece = ({ index }: { index: number }) => {
  const colors = [
    "bg-blue-400", "bg-emerald-400", "bg-amber-400",
    "bg-purple-400", "bg-rose-400", "bg-teal-400",
  ];
  const color = colors[index % colors.length];
  const left = `${Math.random() * 100}%`;
  const delay = `${Math.random() * 2}s`;
  const duration = `${2 + Math.random() * 2}s`;
  const size = Math.random() > 0.5 ? "w-3 h-3" : "w-2 h-2";
  const rotate = `${Math.random() * 360}deg`;
  const shape = Math.random() > 0.5 ? "rounded-sm" : "rounded-full";

  return (
    <div
      className={`absolute top-0 ${size} ${color} ${shape} opacity-0 animate-confetti`}
      style={{
        left,
        animationDelay: delay,
        animationDuration: duration,
        transform: `rotate(${rotate})`,
      }}
    />
  );
};

export default function SelesaiPage() {
  const router = useRouter();
  const [tokenCode, setTokenCode] = useState("");
  const [clientName, setClientName] = useState("");
  const [parentToken, setParentToken] = useState("");
  const [testType, setTestType] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    // Baca info dari session storage
    const token = sessionStorage.getItem("token_code") || "";
    const name = sessionStorage.getItem("client_name") || "";
    const prt = sessionStorage.getItem("parent_token_code") || "";
    const type = sessionStorage.getItem("token_type") || "";

    setTokenCode(token);
    setClientName(name);
    setParentToken(prt);
    setTestType(type);

    // Format waktu selesai
    const now = new Date();
    setTimeStr(
      now.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    );

    // Trigger confetti setelah sedikit delay
    setTimeout(() => setShowConfetti(true), 300);

    // Bersihkan session storage setelah ambil data
    const keysToRemove = [
      "current_token_id", "token_code", "test_code",
      "token_type", "client_data", "test_result_id",
      "cpmGameResults", "cpmTotalTime", "client_name",
    ];
    keysToRemove.forEach((k) => sessionStorage.removeItem(k));
  }, []);

  const getSegmentInfo = () => {
    if (tokenCode.startsWith("CHI-"))
      return {
        icon: "🧒",
        label: "Asesmen Kesiapan SD",
        color: "from-orange-500 to-amber-400",
        bg: "bg-orange-50",
        border: "border-orange-200",
        text: "text-orange-700",
      };
    if (tokenCode.startsWith("STU-"))
      return {
        icon: "🎓",
        label: "Asesmen Penjurusan",
        color: "from-teal-500 to-emerald-400",
        bg: "bg-teal-50",
        border: "border-teal-200",
        text: "text-teal-700",
      };
    if (tokenCode.startsWith("EMP-"))
      return {
        icon: "💼",
        label: "Asesmen Rekrutmen",
        color: "from-violet-500 to-purple-400",
        bg: "bg-violet-50",
        border: "border-violet-200",
        text: "text-violet-700",
      };
    return {
      icon: "📝",
      label: "Asesmen Psikometri",
      color: "from-blue-500 to-indigo-400",
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-700",
    };
  };

  const seg = getSegmentInfo();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Confetti layer */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 60 }).map((_, i) => (
            <ConfettiPiece key={i} index={i} />
          ))}
        </div>
      )}

      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        className="w-full max-w-lg relative"
      >
        {/* Main Card */}
        <div className="bg-slate-800/80 backdrop-blur-2xl border border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header gradient */}
          <div className={`bg-gradient-to-r ${seg.color} p-8 text-center relative`}>
            <div className="absolute inset-0 bg-black/10" />
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              className="relative z-10"
            >
              <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full mx-auto flex items-center justify-center text-5xl border-4 border-white/30 shadow-2xl mb-4">
                ✅
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight drop-shadow">
                Asesmen Selesai!
              </h1>
              <p className="text-white/80 mt-2 font-medium">
                Semua data berhasil tersimpan dengan aman
              </p>
            </motion.div>
          </div>

          {/* Body */}
          <div className="p-8 space-y-6">
            {/* Token & Nama */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-slate-900/60 rounded-2xl p-5 border border-slate-700/50"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                  Rekam Asesmen
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-500 text-xs mb-1">Nama Peserta</p>
                  <p className="font-bold text-white">
                    {clientName || "Peserta"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-1">Kode Token</p>
                  <p className="font-mono font-bold text-blue-400">
                    {tokenCode || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-1">Paket Asesmen</p>
                  <p className="font-semibold text-slate-300">{seg.label}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-1">Waktu Selesai</p>
                  <p className="font-semibold text-slate-300 text-xs">
                    {timeStr}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Token Orang Tua — hanya tampil jika ada */}
            <AnimatePresence>
              {parentToken && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-amber-950/40 border-2 border-amber-500/50 rounded-2xl p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">👨‍👩‍👧</span>
                    <p className="font-bold text-amber-400 text-sm">
                      Penting: Kode untuk Orang Tua
                    </p>
                  </div>
                  <p className="text-slate-300 text-xs mb-3 leading-relaxed">
                    Mohon berikan kode berikut kepada <strong>Orang Tua / Wali</strong> untuk melengkapi kuesioner observasi:
                  </p>
                  <div className="bg-slate-900 border-2 border-dashed border-amber-500/60 rounded-xl py-4 text-center">
                    <span className="text-2xl font-black text-amber-400 tracking-[0.2em] font-mono">
                      {parentToken}
                    </span>
                  </div>
                  <p className="text-amber-500/70 text-xs mt-2 text-center">
                    Catat atau foto kode ini sebelum menutup halaman
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pesan penutup */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mb-6">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Hasil akan dianalisis oleh psikolog berwenang Lentera Batin</span>
              </div>

              <button
                onClick={() => router.push("/")}
                className="w-full flex items-center justify-center gap-3 bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 border border-slate-600"
              >
                <Home className="w-5 h-5" />
                Kembali ke Beranda
              </button>
            </motion.div>
          </div>
        </div>

        {/* Footer branding */}
        <p className="text-center text-slate-600 text-xs mt-6">
          © Lentera Batin Assessment — Layanan Psikometri Profesional
        </p>
      </motion.div>

      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti-fall linear infinite;
        }
      `}</style>
    </main>
  );
}
