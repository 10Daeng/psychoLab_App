"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  FileBarChart2,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    clients: 0,
    completed: 0,
    active: 0,
    pending: 0,
  });
  const [chartData, setChartData] = useState<{ name: string; value: number }[]>(
    [],
  );
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const res = await fetch("/api/admin/dashboard");
        const json = await res.json();
        if (json.success) {
          setStats(json.stats);
          setChartData(json.chartData);
          setRecentActivity(json.recentActivity);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as any, stiffness: 300, damping: 24 },
    },
  };

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#6366f1"];

  const getStatusBadge = (status: string) => {
    if (status === "COMPLETED")
      return (
        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
          Selesai
        </span>
      );
    if (status === "IN_PROGRESS")
      return (
        <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
          Sedang Ujian
        </span>
      );
    return (
      <span className="px-3 py-1 bg-slate-500/20 text-slate-400 text-xs font-bold rounded-full border border-slate-500/30">
        Menunggu
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center p-2 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
               <img
                 src="/logo-lentera-batin.png"
                 alt="Lentera Batin"
                 className="w-full h-full object-contain"
               />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tighter text-white drop-shadow-md">
                Lentera Batin Assessment
              </h1>
              <p className="text-slate-400">
                Dashboard Administrasi & Monitoring Asesmen Psikometri
              </p>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {/* Card 1: Total Klien */}
        <motion.div
          variants={itemVariants}
          className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 relative overflow-hidden group hover:bg-white/10 transition-colors shadow-2xl"
        >
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/20 rounded-full group-hover:scale-150 transition-transform duration-500 ease-in-out blur-xl" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">
                Total Klien Terdaftar
              </p>
              <h3 className="text-4xl font-black text-white drop-shadow-lg">
                {stats.clients}
              </h3>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/30 rounded-2xl flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        {/* Card 2: Ujian Selesai */}
        <motion.div
          variants={itemVariants}
          className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 relative overflow-hidden group hover:bg-white/10 transition-colors shadow-2xl"
        >
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/20 rounded-full group-hover:scale-150 transition-transform duration-500 ease-in-out blur-xl" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">
                Ujian Selesai
              </p>
              <h3 className="text-4xl font-black text-white drop-shadow-lg">
                {stats.completed}
              </h3>
            </div>
            <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        {/* Card 3: Sedang Dikerjakan */}
        <motion.div
          variants={itemVariants}
          className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 relative overflow-hidden group hover:bg-white/10 transition-colors shadow-2xl"
        >
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/20 rounded-full group-hover:scale-150 transition-transform duration-500 ease-in-out blur-xl" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">
                Sedang Mengerjakan
              </p>
              <h3 className="text-4xl font-black text-white drop-shadow-lg">
                {stats.active}
              </h3>
            </div>
            <div className="w-12 h-12 bg-amber-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              <Activity className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        {/* Card 4: Menunggu (Pending) */}
        <motion.div
          variants={itemVariants}
          className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 relative overflow-hidden group hover:bg-white/10 transition-colors shadow-2xl"
        >
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/20 rounded-full group-hover:scale-150 transition-transform duration-500 ease-in-out blur-xl" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">
                Token Belum Dipakai
              </p>
              <h3 className="text-4xl font-black text-white drop-shadow-lg">
                {stats.pending}
              </h3>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 border border-purple-500/30 rounded-2xl flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* QUICK LINKS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          Menu Akses Cepat (Direktori Klien)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="/admin/clients/list/child"
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-5 rounded-2xl shadow-lg shadow-blue-500/30 hover:scale-[1.02] transition-transform flex items-center justify-between group"
          >
            <div>
              <p className="font-bold text-lg">Kesiapan SD</p>
              <p className="text-blue-100 text-sm mt-1">
                Daftar Anak / Siswa TK
              </p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
              →
            </div>
          </a>
          <a
            href="/admin/clients/list/student"
            className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-5 rounded-2xl shadow-lg shadow-emerald-500/30 hover:scale-[1.02] transition-transform flex items-center justify-between group"
          >
            <div>
              <p className="font-bold text-lg">Penjurusan</p>
              <p className="text-emerald-100 text-sm mt-1">Siswa SMP / SMA</p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
              →
            </div>
          </a>
          <a
            href="/admin/clients/list/employee"
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-5 rounded-2xl shadow-lg shadow-purple-500/30 hover:scale-[1.02] transition-transform flex items-center justify-between group"
          >
            <div>
              <p className="font-bold text-lg">Rekrutmen</p>
              <p className="text-purple-100 text-sm mt-1">
                Calon Pegawai / Karyawan
              </p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
              →
            </div>
          </a>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Grafik Distribusi Tes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-1 bg-white/5 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-500/20 border border-indigo-500/30 rounded-xl flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.3)]">
              <FileBarChart2 className="w-5 h-5 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Distribusi Tes</h2>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow:
                      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={50}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-\${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Tabel Aktivitas Terbaru */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white/5 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-500/20 border border-rose-500/30 rounded-xl flex items-center justify-center shadow-[0_0_10px_rgba(225,29,72,0.3)]">
                <AlertCircle className="w-5 h-5 text-rose-400" />
              </div>
              <h2 className="text-xl font-bold text-white">
                Aktivitas Terbaru
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-white/5 rounded-xl border-b border-white/10">
                <tr>
                  <th className="px-4 py-4 rounded-tl-xl font-semibold">
                    Peserta / Token
                  </th>
                  <th className="px-4 py-4 font-semibold">Tujuan Tes</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-4 py-4 rounded-tr-xl font-semibold text-right">
                    Waktu
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      Belum ada aktivitas terekam.
                    </td>
                  </tr>
                ) : (
                  recentActivity.map((act) => (
                    <tr
                      key={act.id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group"
                    >
                      <td className="px-4 py-4">
                        <p className="font-bold text-white group-hover:text-blue-400 transition-colors">{act.name}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          {act.code}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-slate-300 font-medium">
                        {act.purpose?.replace(/_/g, " ") || "-"}
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(act.status)}
                      </td>
                      <td className="px-4 py-4 text-right text-slate-400 text-xs">
                        {new Date(act.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
