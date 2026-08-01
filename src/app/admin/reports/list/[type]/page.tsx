"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  FileText,
  CheckCircle2,
  Clock,
  User,
  X,
  MapPin,
  Building,
  GraduationCap,
  Download,
  Printer,
} from "lucide-react";
import * as XLSX from "xlsx";

export default function AdminReports() {
  const params = useParams();
  const type = params.type as string;

  const typeConfig: Record<
    string,
    { purpose: string; title: string; subtitle: string; color: string }
  > = {
    child: {
      purpose: "KEMATANGAN",
      title: "Laporan Asesmen Anak (CHI)",
      subtitle: "Asesmen Psikologi Anak & Kesiapan SD",
      color: "orange",
    },
    student: {
      purpose: "PENJURUSAN",
      title: "Laporan Asesmen Penjurusan (STU)",
      subtitle: "Penjurusan & Pengembangan Bakat Remaja",
      color: "teal",
    },
    employee: {
      purpose: "REKRUTMEN",
      title: "Laporan Asesmen Rekrutmen (EMP)",
      subtitle: "Rekrutmen & Executive Assessment",
      color: "violet",
    },
  };
  const config = typeConfig[type] || typeConfig.child;
  const currentPurpose = config.purpose;

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<any>(null); // State untuk Pop-up Profil
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/admin/reports?purpose=${currentPurpose}`);
        const result = await res.json();
        
        if (!res.ok) {
          throw new Error(result.error);
        }

        const { childTokens, parentTokens } = result;

      const calculateAge = (birthDate: string) => {
        if (!birthDate) return "-";
        const bDate = new Date(birthDate);
        if (isNaN(bDate.getTime())) return "-";
        const diff = Date.now() - bDate.getTime();
        const age = new Date(diff);
        return Math.abs(age.getUTCFullYear() - 1970);
      };

      const merged = childTokens?.map((ct: any) => {
        const pt = parentTokens?.find((p: any) => p.parent_token_id === ct.id);
        const clientData = ct.clients as any;
        return {
          id: ct.id,
          name: clientData?.name || "Anonim",
          age: calculateAge(clientData?.birth_date),
          gender: clientData?.gender,
          birthDate: clientData?.birth_date,
          schoolOrInstitution: clientData?.school_or_institution,
          grade: clientData?.grade,
          parentName: clientData?.parent_name,
          address: clientData?.address,
          registrationNumber: clientData?.registration_number,
          tokenCode: ct.token_code || "",
          parentStatus: pt?.status || "PENDING",
          status: ct.status,
          respondentType: ct.respondent_type,
          createdAt: ct.created_at,
        };
      });

      setData(merged || []);
      setLoading(false);
      } catch (err: any) {
        console.error("Failed to fetch reports:", err);
        setLoading(false);
      }
    }
    fetchData();
  }, [type]);

  const filteredData = data.filter((row) => {
    if (startDate) {
      const rowDate = new Date(row.createdAt);
      const sDate = new Date(startDate);
      sDate.setHours(0, 0, 0, 0);
      if (rowDate < sDate) return false;
    }
    if (endDate) {
      const rowDate = new Date(row.createdAt);
      const eDate = new Date(endDate);
      eDate.setHours(23, 59, 59, 999);
      if (rowDate > eDate) return false;
    }

    // 3. Filter Pencarian (Nama, Institusi, NIK)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = row.name?.toLowerCase().includes(q);
      const matchSchool = row.schoolOrInstitution?.toLowerCase().includes(q);
      const matchNik = row.registrationNumber?.toLowerCase().includes(q);
      const matchToken = row.tokenCode?.toLowerCase().includes(q);
      if (!matchName && !matchSchool && !matchNik && !matchToken) return false;
    }

    return true;
  });

  const exportToExcel = () => {
    // Siapkan data untuk diekspor
    const exportData = filteredData.map((row) => ({
      "Kode Token": row.tokenCode,
      "Nama Klien": row.name,
      Usia: row.age,
      Gender:
        row.gender === "L"
          ? "Laki-Laki"
          : row.gender === "P"
            ? "Perempuan"
            : row.gender,
      "Tanggal Lahir": row.birthDate,
      "NIK / NISN": row.registrationNumber || "-",
      "Instansi / Sekolah": row.schoolOrInstitution || "-",
      "Jabatan / Kelas": row.grade || "-",
      "Nama Wali": row.parentName || "-",
      "Status Tes": row.status === "COMPLETED" ? "Selesai" : "Sedang Berjalan",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Asesmen");

    // Simpan file
    const fileName = `Ekspor_Klien_${currentPurpose}_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const tableVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      {/* --- POP-UP MODAL PROFIL DETAIL --- */}
      <AnimatePresence>
        {selectedClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-slate-700/50 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-600/30 to-emerald-600/30 blur-2xl pointer-events-none" />

              <div className="flex justify-between items-center p-6 border-b border-slate-800/50 relative z-10">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-400" /> Profil Detail Klien
                </h2>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4 relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-2xl border border-slate-700 shadow-inner">
                    {selectedClient.gender === "L" ? "👦🏻" : "👧🏻"}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">
                      {selectedClient.name}
                    </h3>
                    <p className="text-slate-400 font-mono text-sm flex items-center gap-2 mt-1">
                      Token:{" "}
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-blue-400">
                        {selectedClient.tokenCode}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/30">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">
                      Usia & Kelamin
                    </p>
                    <p className="text-sm font-semibold text-slate-200">
                      {selectedClient.age} thn &bull;{" "}
                      {selectedClient.gender === "L"
                        ? "Laki-Laki"
                        : "Perempuan"}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/30">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">
                      Tanggal Lahir
                    </p>
                    <p className="text-sm font-semibold text-slate-200">
                      {selectedClient.birthDate || "-"}
                    </p>
                  </div>
                </div>

                {(selectedClient.schoolOrInstitution ||
                  selectedClient.grade) && (
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/30">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                      {selectedClient.tokenCode.startsWith("EMP-") ? (
                        <Building className="w-4 h-4" />
                      ) : (
                        <GraduationCap className="w-4 h-4" />
                      )}
                      {selectedClient.tokenCode.startsWith("EMP-")
                        ? "Instansi & Posisi"
                        : "Sekolah & Kelas"}
                    </p>
                    <p className="text-sm font-semibold text-slate-200">
                      {selectedClient.schoolOrInstitution || "-"}
                      {selectedClient.grade ? ` — ${selectedClient.grade}` : ""}
                    </p>
                  </div>
                )}

                {selectedClient.tokenCode.startsWith("CHI-") &&
                  selectedClient.parentName && (
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/30">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-2">
                        <User className="w-4 h-4" /> Wali / Orang Tua
                      </p>
                      <p className="text-sm font-semibold text-slate-200">
                        {selectedClient.parentName}
                      </p>
                    </div>
                  )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* --- END POP-UP --- */}

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-6"
      >
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-400" />
            {config.title}
          </h1>
          <p className="text-slate-400 mt-2">{config.subtitle}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] w-full sm:w-auto justify-center"
          >
            <Download className="w-4 h-4" /> Unduh Excel
          </button>
        </div>
      </motion.div>

      {/* --- BAGIAN FILTER PENCARIAN & TANGGAL --- */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row gap-4 mb-8 bg-slate-900/40 p-4 rounded-2xl border border-slate-800"
      >
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Cari by Nama, NIK, Institusi, atau Token..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700 text-white pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-800/50 border border-slate-700 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
            />
            <span className="absolute -top-2.5 left-3 bg-slate-900 px-1 text-[10px] text-slate-400 uppercase font-bold">
              Mulai Tes
            </span>
          </div>
          <span className="text-slate-600">-</span>
          <div className="relative">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-800/50 border border-slate-700 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
            />
            <span className="absolute -top-2.5 left-3 bg-slate-900 px-1 text-[10px] text-slate-400 uppercase font-bold">
              Sampai Tes
            </span>
          </div>
          {(searchQuery || startDate || endDate) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setStartDate("");
                setEndDate("");
              }}
              className="ml-2 text-slate-400 hover:text-red-400 transition-colors p-2"
              title="Reset Filter"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </motion.div>

      <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-700/50 shadow-2xl rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/80 text-slate-300 uppercase text-xs tracking-wider border-b border-slate-700/50">
              <tr>
                <th className="px-6 py-5">Klien / Peserta</th>
                <th className="px-6 py-5">Kode Token</th>
                {/* Kolom Dinamis berdasarkan Tipe */}
                {currentPurpose === "CHILD" && (
                  <th className="px-6 py-5">Orang Tua / Wali</th>
                )}
                {currentPurpose === "STU" && (
                  <th className="px-6 py-5">Asal Sekolah</th>
                )}
                {currentPurpose === "EMP" && (
                  <th className="px-6 py-5">Instansi & Posisi</th>
                )}

                <th className="px-6 py-5">Status Data</th>
                <th className="px-6 py-5 text-center">Aksi Laporan</th>
              </tr>
            </thead>
            <motion.tbody
              variants={tableVariants}
              initial="hidden"
              animate="show"
              className="divide-y divide-slate-800/50"
            >
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-16 text-slate-500 font-medium"
                  >
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-slate-600" />
                    Memuat data secara aman...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-16 text-slate-500 font-medium"
                  >
                    <Filter className="w-8 h-8 mx-auto mb-3 text-slate-600 opacity-50" />
                    Belum ada data pada kategori ini.
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => {
                  return (
                    <motion.tr
                      variants={rowVariants}
                      key={row.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="px-6 py-5">
                        <button
                          onClick={() => setSelectedClient(row)}
                          className="font-bold text-blue-400 group-hover:text-blue-300 transition-colors hover:underline text-left"
                        >
                          {row.name}
                        </button>
                        <div className="text-xs text-slate-500 mt-1">
                          Usia: {row.age} thn &bull; {row.gender}
                        </div>
                      </td>
                      <td className="px-6 py-5 font-mono text-xs text-slate-400">
                        {row.tokenCode}
                      </td>

                      {/* Kolom Dinamis Konten */}
                      {currentPurpose === "CHILD" && (
                        <td className="px-6 py-5 text-slate-300">
                          {row.parentName || "-"}
                        </td>
                      )}
                      {currentPurpose === "STU" && (
                        <td className="px-6 py-5 text-slate-300">
                          {row.schoolOrInstitution || "-"}{" "}
                          <span className="text-slate-500 text-xs block">
                            {row.grade}
                          </span>
                        </td>
                      )}
                      {currentPurpose === "EMP" && (
                        <td className="px-6 py-5 text-slate-300">
                          {row.schoolOrInstitution || "-"}{" "}
                          <span className="text-slate-500 text-xs block">
                            {row.grade}
                          </span>
                        </td>
                      )}

                      <td className="px-6 py-5">
                        {row.status === "COMPLETED" ? (
                          row.tokenCode.startsWith("CHI-") &&
                          row.parentStatus !== "COMPLETED" ? (
                            <div className="flex items-center gap-2 text-amber-400">
                              <AlertCircle className="w-4 h-4 animate-pulse" />
                              <span className="text-xs font-semibold">
                                Menunggu Ortu
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-emerald-400">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-xs font-semibold">
                                Lengkap & Siap
                              </span>
                            </div>
                          )
                        ) : (
                          <div className="flex items-center gap-2 text-blue-400">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span className="text-xs font-semibold">
                              Sedang Tes
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-2 items-start">
                          <Link
                            href={`/admin/reports/${row.id}`}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors w-full justify-between"
                          >
                            Buka Laporan <ChevronRight className="w-3 h-3" />
                          </Link>
                          {row.tokenCode.startsWith("CHI-") &&
                            row.status === "COMPLETED" && (
                              <Link
                                href={`/admin/reports/${row.id}/print`}
                                target="_blank"
                                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors w-full justify-between"
                              >
                                <Printer className="w-3 h-3" /> Cetak Lengkap
                              </Link>
                            )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </motion.tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
