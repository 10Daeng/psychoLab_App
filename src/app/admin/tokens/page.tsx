"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  KeySquare, Package, Copy, CheckCircle2, Trash2,
  UserPlus, ChevronDown, ChevronUp, X, RefreshCw
} from "lucide-react";

type TestType = { id: string; code: string; name: string };
type Token = {
  id: string;
  token_code: string;
  is_used: boolean;
  created_at: string;
  status: string;
  clients?: { name: string } | null;
};

type GeneratedPair = {
  child_token: string;
  parent_token: string | null;
  client_name: string;
};

const PACKAGES = [
  {
    id: "CHILD",
    prefix: "CHI",
    emoji: "🧸",
    label: "Paket Anak (Kesiapan SD)",
    subtitle: "Skrining kognitif CPM untuk anak TK/PAUD",
    tests: ["CPM"],
    color: "blue",
    hasParentToken: true,
  },
  {
    id: "STU",
    prefix: "STU",
    emoji: "🎓",
    label: "Paket Penjurusan",
    subtitle: "Asesmen minat bakat siswa SMP/SMA",
    tests: ["RAVEN2", "SDS", "VAK"],
    color: "purple",
    hasParentToken: false,
  },
  {
    id: "EMP",
    prefix: "EMP",
    emoji: "💼",
    label: "Paket Rekrutmen",
    subtitle: "Seleksi karyawan / assessment center",
    tests: ["RAVEN2", "HEXACO", "DISC", "WVI"],
    color: "emerald",
    hasParentToken: false,
  },
];

export default function AdminTokens() {
  const [activeTab, setActiveTab] = useState<"open" | "closed">("open");
  const [tokens, setTokens] = useState<Token[]>([]);
  const [dbTests, setDbTests] = useState<TestType[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState("CHILD");
  const [copiedToken, setCopiedToken] = useState("");

  // Closed Token form state
  const [closedPkg, setClosedPkg] = useState("CHILD");
  const [closedForm, setClosedForm] = useState({
    name: "",
    birth_date: "",
    gender: "L",
    school_or_institution: "",
    grade: "",
    parent_name: "",
    parent_phone: "",
    address: "",
    registration_number: "",
    generate_parent_token: true,
  });
  const [closedGenerating, setClosedGenerating] = useState(false);
  const [generatedPairs, setGeneratedPairs] = useState<GeneratedPair[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [seedRes, tokenRes] = await Promise.all([
        fetch("/api/admin/seed-tests"),
        fetch("/api/admin/get-tokens"),
      ]);
      const [seedJson, tokenJson] = await Promise.all([seedRes.json(), tokenRes.json()]);
      if (seedJson.success) setDbTests(seedJson.data || []);
      if (tokenJson.success) setTokens(tokenJson.tokens);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getTestIdsByCodes = (codes: string[]) =>
    codes.map((c) => dbTests.find((t) => t.code === c)?.id).filter(Boolean);

  const generateTokenString = (prefix: string) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return `${prefix}-${result}`;
  };

  // --- Open Token ---
  const handleGenerateOpen = async () => {
    setGenerating(true);
    const pkg = PACKAGES.find((p) => p.id === selectedPackage)!;
    const newTokenCode = generateTokenString(pkg.prefix);
    const testIds = getTestIdsByCodes(pkg.tests);

    if (testIds.length !== pkg.tests.length) {
      alert("Gagal: Beberapa alat tes belum ter-load sempurna di database.");
      setGenerating(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/generate-open-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token_code: newTokenCode,
          test_ids: testIds,
          respondent_type: "SELF",
          purpose: selectedPackage === "CHILD" ? "KEMATANGAN" : selectedPackage === "STU" ? "PENJURUSAN" : "REKRUTMEN",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      await fetchData();
    } catch (error: any) {
      alert("Gagal membuat token: " + error.message);
    } finally {
      setGenerating(false);
    }
  };

  // --- Closed Token ---
  const handleGenerateClosed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closedForm.name || !closedForm.birth_date) {
      alert("Nama dan tanggal lahir wajib diisi!");
      return;
    }
    setClosedGenerating(true);
    try {
      const res = await fetch("/api/admin/generate-paired-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...closedForm, purpose: closedPkg }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      setGeneratedPairs((prev) => [
        { child_token: data.child_token, parent_token: data.parent_token, client_name: closedForm.name },
        ...prev,
      ]);
      setClosedForm({
        name: "", birth_date: "", gender: "L",
        school_or_institution: "", grade: "", parent_name: "",
        parent_phone: "", address: "", registration_number: "",
        generate_parent_token: true,
      });
      await fetchData();
    } catch (err: any) {
      alert("Gagal membuat token: " + err.message);
    } finally {
      setClosedGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(text);
    setTimeout(() => setCopiedToken(""), 2000);
  };

  const handleDelete = async (id: string, isUsed: boolean) => {
    if (isUsed) {
      alert("Token ini sudah dipakai oleh klien dan tidak bisa dihapus karena ada relasi data.");
      return;
    }
    if (!window.confirm("Hapus token ini secara permanen?")) return;
    try {
      const res = await fetch(`/api/admin/delete-token?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      await fetchData();
    } catch (error: any) {
      alert("Gagal menghapus token: " + error.message);
    }
  };

  const selectedPkgInfo = PACKAGES.find((p) => p.id === selectedPackage)!;
  const closedPkgInfo = PACKAGES.find((p) => p.id === closedPkg)!;

  const colorMap: Record<string, { border: string; bg: string; check: string; badge: string }> = {
    blue: { border: "border-blue-500", bg: "bg-blue-500/10", check: "text-blue-500", badge: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    purple: { border: "border-purple-500", bg: "bg-purple-500/10", check: "text-purple-500", badge: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
    emerald: { border: "border-emerald-500", bg: "bg-emerald-500/10", check: "text-emerald-500", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-black text-slate-100 tracking-tight flex items-center gap-3">
          <KeySquare className="w-8 h-8 text-blue-400" />
          Manajemen Token Asesmen
        </h1>
        <p className="text-slate-400 mt-2">
          Buat token publik (tanpa klien) atau token tertutup (langsung terhubung ke klien).
        </p>
      </motion.div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-8 bg-slate-800/50 p-1 rounded-2xl w-fit border border-slate-700/50">
        {[
          { id: "open", label: "Token Publik (Open)" },
          { id: "closed", label: "Token Tertutup (Paired)" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "open" | "closed")}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ===== OPEN TOKEN TAB ===== */}
        {activeTab === "open" && (
          <motion.div key="open" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-3xl border border-slate-700/50 mb-8 shadow-2xl">
              <h2 className="text-lg font-bold text-slate-200 mb-6">
                Pilih Paket &amp; Generate Token Publik
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {PACKAGES.map((pkg) => {
                  const c = colorMap[pkg.color];
                  const isSelected = selectedPackage === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg.id)}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                        isSelected ? `${c.border} ${c.bg}` : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-2xl">{pkg.emoji}</span>
                        {isSelected && <CheckCircle2 className={`w-5 h-5 ${c.check}`} />}
                      </div>
                      <h3 className="font-bold text-slate-200 mb-1">{pkg.label}</h3>
                      <p className="text-xs text-slate-400 mb-3">{pkg.subtitle}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {pkg.tests.map((t) => (
                          <span key={t} className="px-2 py-0.5 bg-slate-700 rounded text-[10px] font-bold text-slate-300">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end border-t border-slate-800/50 pt-6">
                <button
                  onClick={handleGenerateOpen}
                  disabled={generating}
                  className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50 text-lg"
                >
                  <Package className="w-5 h-5" />
                  {generating ? "Membuat Token..." : "Generate Token Publik"}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ===== CLOSED TOKEN TAB ===== */}
        {activeTab === "closed" && (
          <motion.div key="closed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Form */}
              <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-slate-700/50 shadow-2xl">
                <h2 className="text-lg font-bold text-slate-200 mb-5 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-400" />
                  Buat Token Tertutup + Klien Baru
                </h2>

                {/* Pilih Paket */}
                <div className="flex gap-2 mb-5 flex-wrap">
                  {PACKAGES.map((pkg) => {
                    const c = colorMap[pkg.color];
                    const isSel = closedPkg === pkg.id;
                    return (
                      <button
                        key={pkg.id}
                        onClick={() => setClosedPkg(pkg.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          isSel ? `${c.border} ${c.bg} ${c.check}` : "border-slate-700 text-slate-400 hover:border-slate-500"
                        }`}
                      >
                        {pkg.emoji} {pkg.label.split("(")[0].trim()}
                      </button>
                    );
                  })}
                </div>

                <form onSubmit={handleGenerateClosed} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">
                      Nama Lengkap <span className="text-red-400">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={closedForm.name}
                      onChange={(e) => setClosedForm({ ...closedForm, name: e.target.value })}
                      className="w-full bg-slate-800/50 border border-slate-700 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
                      placeholder="Nama lengkap peserta"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">
                        Tanggal Lahir <span className="text-red-400">*</span>
                      </label>
                      <input
                        required
                        type="date"
                        value={closedForm.birth_date}
                        onChange={(e) => setClosedForm({ ...closedForm, birth_date: e.target.value })}
                        className="w-full bg-slate-800/50 border border-slate-700 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Jenis Kelamin</label>
                      <select
                        value={closedForm.gender}
                        onChange={(e) => setClosedForm({ ...closedForm, gender: e.target.value })}
                        className="w-full bg-slate-800/50 border border-slate-700 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
                      >
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">
                      {closedPkg === "EMP" ? "Perusahaan / Instansi" : "Asal Sekolah / TK"}
                    </label>
                    <input
                      type="text"
                      value={closedForm.school_or_institution}
                      onChange={(e) => setClosedForm({ ...closedForm, school_or_institution: e.target.value })}
                      className="w-full bg-slate-800/50 border border-slate-700 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
                      placeholder="Opsional"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">
                      {closedPkg === "EMP" ? "Posisi / Jabatan" : "Kelas"}
                    </label>
                    <input
                      type="text"
                      value={closedForm.grade}
                      onChange={(e) => setClosedForm({ ...closedForm, grade: e.target.value })}
                      className="w-full bg-slate-800/50 border border-slate-700 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
                      placeholder="Opsional"
                    />
                  </div>

                  {closedPkg === "CHILD" && (
                    <>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Nama Orang Tua / Wali</label>
                        <input
                          type="text"
                          value={closedForm.parent_name}
                          onChange={(e) => setClosedForm({ ...closedForm, parent_name: e.target.value })}
                          className="w-full bg-slate-800/50 border border-slate-700 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
                          placeholder="Opsional"
                        />
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div
                          onClick={() => setClosedForm({ ...closedForm, generate_parent_token: !closedForm.generate_parent_token })}
                          className={`w-10 h-6 rounded-full transition-colors relative ${closedForm.generate_parent_token ? "bg-blue-600" : "bg-slate-700"}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${closedForm.generate_parent_token ? "translate-x-5" : "translate-x-1"}`} />
                        </div>
                        <span className="text-sm text-slate-300 font-medium">
                          Generate token orang tua (PRT-)
                        </span>
                      </label>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={closedGenerating}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 mt-2"
                  >
                    {closedGenerating ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    {closedGenerating ? "Membuat..." : "Buat Klien + Token"}
                  </button>
                </form>
              </div>

              {/* Generated Results */}
              <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-slate-700/50 shadow-2xl">
                <h2 className="text-lg font-bold text-slate-200 mb-5">Token yang Baru Dibuat</h2>
                {generatedPairs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                    <KeySquare className="w-10 h-10 mb-3 opacity-30" />
                    <p className="text-sm">Belum ada token tertutup yang dibuat.</p>
                    <p className="text-xs mt-1">Isi form di sebelah kiri untuk memulai.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                    {generatedPairs.map((pair, i) => (
                      <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
                        <p className="text-sm font-bold text-slate-300 mb-3">{pair.client_name}</p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between bg-slate-900 rounded-xl px-3 py-2">
                            <div>
                              <p className="text-[10px] text-slate-500 mb-0.5">Token Peserta</p>
                              <span className="font-mono font-bold text-white tracking-wider">{pair.child_token}</span>
                            </div>
                            <button
                              onClick={() => copyToClipboard(pair.child_token)}
                              className="text-slate-500 hover:text-blue-400 transition-colors p-1.5"
                            >
                              {copiedToken === pair.child_token ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                          {pair.parent_token && (
                            <div className="flex items-center justify-between bg-amber-950/50 border border-amber-800/30 rounded-xl px-3 py-2">
                              <div>
                                <p className="text-[10px] text-amber-500 mb-0.5">Token Orang Tua</p>
                                <span className="font-mono font-bold text-amber-300 tracking-wider">{pair.parent_token}</span>
                              </div>
                              <button
                                onClick={() => copyToClipboard(pair.parent_token!)}
                                className="text-slate-500 hover:text-amber-400 transition-colors p-1.5"
                              >
                                {copiedToken === pair.parent_token ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Token List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-slate-700/50 overflow-hidden shadow-2xl"
      >
        <div className="px-8 py-5 border-b border-slate-800/60 flex justify-between items-center bg-slate-800/20">
          <h2 className="font-bold text-white text-lg">Riwayat Semua Token</h2>
          <button onClick={fetchData} className="text-sm text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold tracking-widest border-b border-slate-800">
              <tr>
                <th className="px-8 py-4">Kode Token</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Klien / Peserta</th>
                <th className="px-8 py-4">Tanggal Dibuat</th>
                <th className="px-8 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr><td colSpan={5} className="px-8 py-16 text-center text-slate-500">Menyinkronkan data...</td></tr>
              ) : tokens.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-16 text-center text-slate-500">Belum ada token yang dibuat.</td></tr>
              ) : (
                tokens.map((token) => (
                  <tr key={token.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-white tracking-wider bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                          {token.token_code}
                        </span>
                        <button
                          onClick={() => copyToClipboard(token.token_code)}
                          className="text-slate-500 hover:text-blue-400 transition-colors"
                        >
                          {copiedToken === token.token_code ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      {token.status === "COMPLETED" ? (
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold">Selesai</span>
                      ) : token.is_used ? (
                        <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-bold">Sedang Aktif</span>
                      ) : (
                        <span className="px-3 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded-full text-xs font-bold">Belum Terpakai</span>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      {token.clients?.name ? (
                        <span className="font-semibold text-slate-300">{token.clients.name}</span>
                      ) : (
                        <span className="text-slate-500 italic text-xs">Token Publik</span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-slate-400 text-xs">
                      {new Date(token.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-8 py-5 text-center">
                      <button
                        onClick={() => handleDelete(token.id, token.is_used)}
                        className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
