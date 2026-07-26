"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BiodataOpen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tokenType, setTokenType] = useState(""); // CHILD, STU, EMP

  const [clientId, setClientId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    birth_place: "",
    birth_date: "",
    gender: "L",
    school_or_institution: "",
    grade: "",
    parent_name: "",
    parent_phone: "",
    address: "",
    registration_number: "",
    test_registration_number: "",
    target_institution: "",
    test_purpose: "",
    birth_order: "",
    special_needs: "",
    parent_job: "",
    parent_education: "",
  });

  useEffect(() => {
    const code = sessionStorage.getItem("token_code") || "";
    if (code.startsWith("CHI-")) setTokenType("CHILD");
    else if (code.startsWith("STU-")) setTokenType("STU");
    else if (code.startsWith("EMP-")) setTokenType("EMP");
    else setTokenType("UNKNOWN");

    const searchParams = new URLSearchParams(window.location.search);
    const isEdit = searchParams.get("edit");
    const storedData = sessionStorage.getItem("client_data");

    if (isEdit && storedData) {
      try {
        const parsed = JSON.parse(storedData);
        setClientId(parsed.id);
        setFormData({
          name: parsed.name || "",
          birth_place: parsed.birth_place || "",
          birth_date: parsed.birth_date || "",
          gender: parsed.gender || "L",
          school_or_institution: parsed.school_or_institution || "",
          grade: parsed.grade || "",
          parent_name: parsed.parent_name || "",
          parent_phone: parsed.parent_phone || "",
          address: parsed.address || "",
          registration_number: parsed.registration_number || "",
          test_registration_number: parsed.test_registration_number || "",
          target_institution: parsed.target_institution || "",
          test_purpose: parsed.test_purpose || "",
          birth_order: parsed.birth_order || "",
          special_needs: parsed.special_needs || "",
          parent_job: parsed.parent_job || "",
          parent_education: parsed.parent_education || "",
        });
      } catch (e) {}
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/save-biodata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          client_id: clientId,
          token_id: sessionStorage.getItem("current_token_id"),
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Gagal menyimpan biodata");

      // Set client_id
      sessionStorage.setItem("client_data", JSON.stringify(data.client));
      // Simpan nama untuk halaman selesai
      sessionStorage.setItem("client_name", data.client?.name || "");

      // Lanjut konfirmasi
      router.push("/biodata/confirm");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-3xl bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-slate-200">
        <h1 className="text-3xl font-black text-slate-800 text-center mb-2 tracking-tight">
          Lengkapi Biodata
        </h1>
        <p className="text-center text-slate-500 mb-8 text-sm">
          {tokenType === "CHILD"
            ? "Data anak yang akan mengikuti tes kognitif."
            : tokenType === "STU"
              ? "Data diri siswa untuk asesmen penjurusan."
              : tokenType === "EMP"
                ? "Data diri kandidat untuk keperluan rekrutmen."
                : "Silakan lengkapi data diri Anda."}
        </p>

        {error && (
          <div className="text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 text-sm font-semibold mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* BAGIAN 1: ADMINISTRASI TES */}
          <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 space-y-5">
            <h2 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
              <span className="bg-blue-600 text-white w-6 h-6 rounded-full inline-flex items-center justify-center text-sm">
                1
              </span>
              Administrasi Tes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-slate-600 mb-1 block">
                  Nomor Pendaftaran (Opsional)
                </label>
                <input
                  type="text"
                  name="test_registration_number"
                  value={formData.test_registration_number}
                  placeholder="Contoh: PMB-2026-001"
                  className="w-full p-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-colors font-medium text-slate-800"
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 mb-1 block">
                  Tujuan Tes
                </label>
                <select
                  name="test_purpose"
                  value={formData.test_purpose}
                  className="w-full p-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-colors font-medium text-slate-800"
                  onChange={handleChange}
                >
                  <option value="">Pilih Tujuan Tes...</option>
                  <option value="Seleksi SPMB">
                    Seleksi Penerimaan Siswa Baru (SPMB)
                  </option>
                  <option value="Pemetaan Bakat & Penjurusan">
                    Pemetaan Bakat & Penjurusan
                  </option>
                  <option value="Evaluasi Psikologis">
                    Evaluasi Psikologis Berkala
                  </option>
                  <option value="Rekrutmen Karyawan">Rekrutmen Karyawan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-slate-600 mb-1 block">
                Institusi / Sekolah yang Meminta Hasil Tes
              </label>
              <input
                type="text"
                name="target_institution"
                value={formData.target_institution}
                placeholder="Contoh: SDIT Al-Hidayah / PT. XYZ"
                className="w-full p-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-colors font-medium text-slate-800"
                onChange={handleChange}
              />
            </div>
          </div>

          {/* BAGIAN 2: IDENTITAS DIRI */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="bg-slate-800 text-white w-6 h-6 rounded-full inline-flex items-center justify-center text-sm">
                2
              </span>
              Identitas Diri
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-bold text-slate-600 mb-1 block">
                  {tokenType === "CHILD" ? "Nama Lengkap Anak" : "Nama Lengkap"}
                </label>
                <input
                  required
                  type="text"
                  name="name"
                  value={formData.name}
                  className="w-full p-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-colors font-medium text-slate-800"
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-600 mb-1 block">
                  Tempat Lahir
                </label>
                <input
                  required
                  type="text"
                  name="birth_place"
                  value={formData.birth_place}
                  className="w-full p-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-colors font-medium text-slate-800"
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 mb-1 block">
                  Tanggal Lahir
                </label>
                <input
                  required
                  type="date"
                  name="birth_date"
                  value={formData.birth_date}
                  className="w-full p-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-colors font-medium text-slate-800"
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-600 mb-1 block">
                  Jenis Kelamin
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  className="w-full p-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-colors font-medium text-slate-800"
                  onChange={handleChange}
                >
                  <option value="L">Laki-Laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>

              {(tokenType === "CHILD" || tokenType === "STU") && (
                <div>
                  <label className="text-sm font-bold text-slate-600 mb-1 block">
                    Anak Ke- (Opsional)
                  </label>
                  <input
                    type="text"
                    name="birth_order"
                    value={formData.birth_order}
                    placeholder="Contoh: 1 dari 3 bersaudara"
                    className="w-full p-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-colors font-medium text-slate-800"
                    onChange={handleChange}
                  />
                </div>
              )}

              {(tokenType === "CHILD" || tokenType === "STU") && (
                <div>
                  <label className="text-sm font-bold text-slate-600 mb-1 block">
                    NIK / NISN (Opsional)
                  </label>
                  <input
                    type="text"
                    name="registration_number"
                    value={formData.registration_number}
                    placeholder="Nomor Induk Kependudukan / Siswa"
                    className="w-full p-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-colors font-medium text-slate-800"
                    onChange={handleChange}
                  />
                </div>
              )}

              {(tokenType === "CHILD" || tokenType === "STU") && (
                <div>
                  <label className="text-sm font-bold text-slate-600 mb-1 block">
                    Asal Sekolah
                  </label>
                  <input
                    type="text"
                    name="school_or_institution"
                    value={formData.school_or_institution}
                    placeholder="Contoh: SD/SMP/SMA Negeri 1"
                    className="w-full p-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-colors font-medium text-slate-800"
                    onChange={handleChange}
                  />
                </div>
              )}

              {tokenType === "EMP" && (
                <div>
                  <label className="text-sm font-bold text-slate-600 mb-1 block">
                    Asal Perusahaan / Instansi
                  </label>
                  <input
                    type="text"
                    name="school_or_institution"
                    value={formData.school_or_institution}
                    placeholder="Opsional jika fresh graduate"
                    className="w-full p-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-colors font-medium text-slate-800"
                    onChange={handleChange}
                  />
                </div>
              )}

              {(tokenType === "STU" || tokenType === "CHILD") && (
                <div>
                  <label className="text-sm font-bold text-slate-600 mb-1 block">
                    Kelas Saat Ini
                  </label>
                  <input
                    type="text"
                    name="grade"
                    value={formData.grade}
                    placeholder="Contoh: Kelas 1 / TK B"
                    className="w-full p-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-colors font-medium text-slate-800"
                    onChange={handleChange}
                  />
                </div>
              )}

              {tokenType === "EMP" && (
                <div>
                  <label className="text-sm font-bold text-slate-600 mb-1 block">
                    Posisi / Jabatan yang Dilamar
                  </label>
                  <input
                    type="text"
                    name="grade"
                    value={formData.grade}
                    placeholder="Contoh: Staff Marketing"
                    className="w-full p-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-colors font-medium text-slate-800"
                    onChange={handleChange}
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="text-sm font-bold text-slate-600 mb-1 block">
                  Alamat Lengkap
                </label>
                <textarea
                  required
                  name="address"
                  value={formData.address}
                  rows={2}
                  placeholder="Jalan, RT/RW, Kelurahan, Kecamatan"
                  className="w-full p-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-colors font-medium text-slate-800"
                  onChange={handleChange}
                ></textarea>
              </div>

              {(tokenType === "CHILD" || tokenType === "STU") && (
                <div className="md:col-span-2 bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                  <label className="text-sm font-bold text-yellow-900 mb-1 block">
                    Kondisi / Kebutuhan Khusus (Sangat Penting)
                  </label>
                  <p className="text-xs text-yellow-700 mb-2">
                    Mohon sebutkan jika peserta menggunakan alat bantu (kacamata
                    minus/silinder, alat bantu dengar) atau buta warna, karena
                    berpengaruh pada tes visual.
                  </p>
                  <input
                    type="text"
                    name="special_needs"
                    value={formData.special_needs}
                    placeholder="Contoh: Berkacamata minus 1, Buta warna parsial. (Kosongkan jika tidak ada)"
                    className="w-full p-3.5 border-2 border-yellow-200 bg-white rounded-xl focus:border-yellow-500 focus:ring-0 outline-none transition-colors font-medium text-slate-800"
                    onChange={handleChange}
                  />
                </div>
              )}
            </div>
          </div>

          {/* BAGIAN 3: DATA ORANG TUA */}
          {(tokenType === "CHILD" || tokenType === "STU") && (
            <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 space-y-5">
              <h2 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
                <span className="bg-emerald-600 text-white w-6 h-6 rounded-full inline-flex items-center justify-center text-sm">
                  3
                </span>
                Data Orang Tua / Wali
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-bold text-slate-600 mb-1 block">
                    Nama Orang Tua / Wali
                  </label>
                  <input
                    type="text"
                    name="parent_name"
                    value={formData.parent_name}
                    placeholder="Nama Ayah / Ibu / Wali"
                    className="w-full p-3.5 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-0 outline-none transition-colors font-medium text-slate-800"
                    onChange={handleChange}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-bold text-slate-600 mb-1 block">
                    Nomor WhatsApp Orang Tua / Wali
                  </label>
                  <input
                    type="tel"
                    name="parent_phone"
                    value={formData.parent_phone}
                    placeholder="Contoh: 081234567890"
                    className="w-full p-3.5 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-0 outline-none transition-colors font-medium text-slate-800"
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-600 mb-1 block">
                    Pendidikan Terakhir Orang Tua
                  </label>
                  <select
                    name="parent_education"
                    value={formData.parent_education}
                    className="w-full p-3.5 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-0 outline-none transition-colors font-medium text-slate-800"
                    onChange={handleChange}
                  >
                    <option value="">Pilih...</option>
                    <option value="SD/Sederajat">SD / Sederajat</option>
                    <option value="SMP/Sederajat">SMP / Sederajat</option>
                    <option value="SMA/Sederajat">SMA / Sederajat</option>
                    <option value="D3">Diploma (D3)</option>
                    <option value="S1">Sarjana (S1)</option>
                    <option value="S2/S3">Pascasarjana (S2/S3)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-600 mb-1 block">
                    Pekerjaan Orang Tua
                  </label>
                  <input
                    type="text"
                    name="parent_job"
                    value={formData.parent_job}
                    placeholder="Contoh: PNS, Wiraswasta, Karyawan"
                    className="w-full p-3.5 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-0 outline-none transition-colors font-medium text-slate-800"
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl mt-6 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 text-lg"
          >
            {loading ? "Menyimpan Data..." : "Simpan & Lanjutkan"}
          </button>
        </form>
      </div>
    </main>
  );
}
