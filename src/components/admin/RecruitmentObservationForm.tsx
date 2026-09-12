"use client";

import React, { useState } from "react";
import {
  Save, RefreshCw, CheckCircle2, ChevronDown, ChevronUp,
  ClipboardCheck, MessageSquare, Star, AlertTriangle, X
} from "lucide-react";

interface RecruitmentObsData {
  observation: Record<string, any>;
  anamnesa: Record<string, string>;
  impression: Record<string, any>;
  notes: string;
}

const SPEED_OPTIONS = ["Sangat Cepat (< 50% waktu)", "Cepat & Tepat", "Normal", "Lambat", "Sangat Lambat"];
const COMPLIANCE_OPTIONS = ["Paham instruksi langsung", "Butuh penjelasan 1x", "Butuh penjelasan >1x", "Tampak kebingungan meski sudah dijelaskan"];

interface Props {
  initialData: RecruitmentObsData;
  onSave: (data: string) => Promise<void>;
}

export default function RecruitmentObservationForm({ initialData, onSave }: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>("obs");

  const [obs, setObs] = useState<Record<string, any>>(initialData.observation || {});
  const [anamnesa, setAnamnesa] = useState<Record<string, string>>(initialData.anamnesa || {});
  const [impression, setImpression] = useState<Record<string, any>>(initialData.impression || {});
  const [notes, setNotes] = useState(initialData.notes || "");

  const initialCustomKeys = Object.keys(initialData.anamnesa || {})
    .filter(k => k.startsWith("custom_") && k.endsWith("_label"))
    .map(k => k.replace("_label", ""));
  const [customQKeys, setCustomQKeys] = useState<string[]>(initialCustomKeys);

  const setObsVal = (key: string, value: any) => setObs(p => ({ ...p, [key]: value }));
  const setAnaVal = (key: string, value: string) => setAnamnesa(p => ({ ...p, [key]: value }));
  const setImpVal = (key: string, value: any) => setImpression(p => ({ ...p, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const payload: RecruitmentObsData = { observation: obs, anamnesa, impression, notes };
    await onSave(JSON.stringify(payload));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const Section = ({
    id, icon, title, subtitle, color, children
  }: {
    id: string; icon: React.ReactNode; title: string; subtitle: string;
    color: string; children: React.ReactNode;
  }) => {
    const open = openSection === id;
    return (
      <div className={`border rounded-2xl overflow-hidden shadow-sm ${open ? `border-${color}-400` : "border-slate-200"}`}>
        <button
          type="button"
          onClick={() => setOpenSection(open ? null : id)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-${color}-100`}>{icon}</div>
            <div>
              <p className="font-bold text-slate-800 text-sm">{title}</p>
              <p className="text-xs text-slate-400">{subtitle}</p>
            </div>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {open && <div className="px-5 pb-6 space-y-4 border-t border-slate-100 pt-4">{children}</div>}
      </div>
    );
  };

  const RadioGroup = ({
    label, stateKey, options, hint
  }: {
    label: string; stateKey: string; options: string[]; hint?: string;
  }) => (
    <div className="p-4 bg-white border border-slate-200 rounded-xl">
      <p className="font-semibold text-slate-700 text-sm mb-1">{label}</p>
      {hint && <p className="text-xs text-slate-400 mb-2 italic">{hint}</p>}
      <div className="flex flex-wrap gap-2 mt-2">
        {options.map(opt => {
          const selected = obs[stateKey] === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => setObsVal(stateKey, selected ? undefined : opt)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                selected
                  ? "bg-teal-600 border-teal-600 text-white shadow-sm"
                  : "bg-white border-slate-300 text-slate-600 hover:border-teal-400"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );

  const CheckItem = ({
    stateKey, label, isWarning
  }: {
    stateKey: string; label: string; isWarning?: boolean;
  }) => {
    const checked = !!obs[stateKey];
    return (
      <label className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer border transition-all ${
        checked
          ? isWarning ? "border-rose-300 bg-rose-50" : "border-teal-300 bg-teal-50"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}>
        <input
          type="checkbox"
          className="w-4 h-4 mt-0.5 accent-teal-600 flex-shrink-0"
          checked={checked}
          onChange={e => setObsVal(stateKey, e.target.checked)}
        />
        <span className="text-sm text-slate-700 leading-snug">
          {isWarning && <span className="mr-1 text-rose-500">⚠</span>}
          {label}
        </span>
      </label>
    );
  };

  const AnaQ = ({
    qKey, label, hint, inputType = "textarea"
  }: {
    qKey: string; label: string; hint?: string; inputType?: "textarea" | "text";
  }) => (
    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
      <p className="font-semibold text-slate-700 text-sm">{label}</p>
      {hint && <p className="text-xs text-slate-400 italic">{hint}</p>}
      {inputType === "text" ? (
        <input
          type="text"
          className="w-full text-slate-800 text-sm p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 bg-slate-50"
          placeholder="Jawaban kandidat..."
          value={anamnesa[`${qKey}_ans`] || ""}
          onChange={e => setAnaVal(`${qKey}_ans`, e.target.value)}
        />
      ) : (
        <textarea
          rows={2}
          className="w-full text-slate-800 text-sm p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 bg-slate-50"
          placeholder="Jawaban kandidat..."
          value={anamnesa[`${qKey}_ans`] || ""}
          onChange={e => setAnaVal(`${qKey}_ans`, e.target.value)}
        />
      )}
      <textarea
        rows={2}
        className="w-full text-sm p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 bg-blue-50/50"
        placeholder="Interpretasi psikolog..."
        value={anamnesa[`${qKey}_int`] || ""}
        onChange={e => setAnaVal(`${qKey}_int`, e.target.value)}
      />
    </div>
  );

  const RatingRow = ({ impKey, label }: { impKey: string; label: string }) => (
    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-slate-700 text-sm">{label}</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setImpVal(`${impKey}_score`, impression[`${impKey}_score`] === n ? 0 : n)}
              className={`w-8 h-8 rounded-full text-xs font-bold transition-all border ${
                (impression[`${impKey}_score`] || 0) >= n
                  ? "bg-amber-400 border-amber-400 text-white"
                  : "bg-white border-slate-300 text-slate-400 hover:border-amber-300"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <input
        type="text"
        className="w-full text-sm p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 bg-slate-50"
        placeholder="Komentar singkat..."
        value={impression[`${impKey}_note`] || ""}
        onChange={e => setImpVal(`${impKey}_note`, e.target.value)}
      />
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Save Button */}
      <div className="flex items-center justify-between pb-2">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Lembar Observasi Rekrutmen</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Data ini akan digunakan AI untuk memperkaya interpretasi dinamika kepribadian kandidat.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-teal-100 disabled:opacity-50 transition-all"
        >
          {saving
            ? <RefreshCw className="w-4 h-4 animate-spin" />
            : saved
            ? <CheckCircle2 className="w-4 h-4" />
            : <Save className="w-4 h-4" />}
          {saving ? "Menyimpan..." : saved ? "Tersimpan!" : "Simpan Observasi"}
        </button>
      </div>

      {/* ── A. OBSERVASI PERILAKU TES ───────────────────────────────────────── */}
      <Section
        id="obs"
        icon={<ClipboardCheck className="w-5 h-5 text-teal-600" />}
        title="A. Observasi Perilaku Selama Tes"
        subtitle="Catat perilaku kandidat saat mengerjakan tes psikometri"
        color="teal"
      >
        <RadioGroup
          label="Kecepatan Mengerjakan"
          stateKey="speed"
          options={SPEED_OPTIONS}
          hint="Perkiraan berdasarkan pengamatan waktu pengerjaan"
        />

        <RadioGroup
          label="Kepatuhan Instruksi"
          stateKey="compliance"
          options={COMPLIANCE_OPTIONS}
        />

        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Konsentrasi & Sikap</p>
          <div className="space-y-2">
            <CheckItem stateKey="fokus" label="Fokus dan konsentrasi sepanjang sesi" />
            <CheckItem stateKey="gelisah" label="Gelisah / sering bergerak / tidak bisa diam" isWarning />
            <CheckItem stateKey="ngantuk" label="Tampak mengantuk atau kelelahan" isWarning />
            <CheckItem stateKey="ponsel" label="Mencoba melihat / menggunakan ponsel" isWarning />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Reaksi saat Soal Sulit</p>
          <div className="space-y-2">
            <CheckItem stateKey="persist" label="Tetap berusaha meski kesulitan (resiliensi tinggi)" />
            <CheckItem stateKey="menyerah" label="Cepat menyerah / langsung skip" isWarning />
            <CheckItem stateKey="frustrasi" label="Tampak frustrasi / ekspresi tidak nyaman" isWarning />
            <CheckItem stateKey="tenang" label="Tetap tenang dan tidak terlihat terganggu" />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Kesungguhan & Integritas</p>
          <div className="space-y-2">
            <CheckItem stateKey="sungguh" label="Terlihat mengerjakan dengan sungguh-sungguh" />
            <CheckItem stateKey="asal" label="Menjawab sangat cepat tanpa pertimbangan (indikasi asal-asalan)" isWarning />
            <CheckItem stateKey="curang" label="Ada indikasi curang / mencari bantuan luar" isWarning />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <p className="font-semibold text-slate-700 text-sm mb-2">Catatan Observasi Tambahan</p>
          <textarea
            rows={2}
            className="w-full text-slate-800 text-sm p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-400 bg-slate-50"
            placeholder="Hal-hal spesifik yang perlu dicatat selama sesi tes..."
            value={obs.obs_notes || ""}
            onChange={e => setObsVal("obs_notes", e.target.value)}
          />
        </div>
      </Section>

      {/* ── B. ANAMNESA KARIR ───────────────────────────────────────────────── */}
      <Section
        id="anamnesa"
        icon={<MessageSquare className="w-5 h-5 text-blue-600" />}
        title="B. Anamnesa & Wawancara Karir"
        subtitle="Gali latar belakang dan motivasi kandidat melalui wawancara singkat"
        color="blue"
      >
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
          💡 Untuk setiap pertanyaan: tulis jawaban kandidat di kotak pertama, interpretasi psikolog di kotak kedua.
        </div>

        <AnaQ
          qKey="alasan"
          label="Mengapa melamar posisi ini?"
          hint="Cari tahu apakah motivasinya intrinsik (passion, relevansi karir) atau ekstrinsik (gaji, terpaksa)"
        />
        <AnaQ
          qKey="riwayat"
          label="Pekerjaan terakhir & alasan keluar?"
          hint="Perhatikan pola — apakah sering keluar karena konflik, atau alasan logis?"
        />
        <AnaQ
          qKey="tekanan"
          label="Ceritakan pengalaman menghadapi tekanan/konflik di tempat kerja."
          hint="Menggali coping style, kedewasaan emosi, dan kemampuan manajemen konflik"
        />
        <AnaQ
          qKey="gaji"
          label="Ekspektasi gaji & benefit?"
          hint="Kecocokan ekspektasi dengan standar perusahaan"
          inputType="text"
        />
        <AnaQ
          qKey="karir"
          label="Rencana atau harapan karir 3-5 tahun ke depan?"
          hint="Ambisi, komitmen jangka panjang, dan keselarasan dengan arah organisasi"
        />
        <AnaQ
          qKey="kekuatan"
          label="Apa yang menjadi kekuatan terbesar Anda?"
          hint="Perhatikan kesesuaian self-assessment dengan profil tes"
        />
        <AnaQ
          qKey="kelemahan"
          label="Apa kelemahan yang sedang Anda kembangkan?"
          hint="Menilai self-awareness dan growth mindset"
        />
        <AnaQ
          qKey="integritas"
          label="Ceritakan situasi di mana Anda harus mengambil keputusan yang bertentangan dengan instruksi atasan atau kebijakan perusahaan."
          hint="Cross-check dimensi Honesty-Humility di HEXACO"
        />
        <AnaQ
          qKey="tim"
          label="Bagaimana peran Anda biasanya dalam sebuah tim: memimpin, mendukung, atau eksekutor? Berikan contohnya."
          hint="Validasi silang dimensi Dominance/Influence di DISC"
        />
        <AnaQ
          qKey="kritik"
          label="Ceritakan pengalaman Anda menerima kritik yang cukup keras dari atasan. Bagaimana reaksi Anda saat itu?"
          hint="Melengkapi pertanyaan kelemahan dengan data perilaku aktual"
        />

        {customQKeys.map(kKey => (
          <div key={kKey} className="p-4 bg-white border border-blue-200 rounded-xl space-y-2 relative">
            <button
              onClick={() => {
                setCustomQKeys(p => p.filter(k => k !== kKey));
                const newAna = { ...anamnesa };
                delete newAna[`${kKey}_label`];
                delete newAna[`${kKey}_ans`];
                delete newAna[`${kKey}_int`];
                setAnamnesa(newAna);
              }}
              className="absolute top-3 right-3 text-rose-400 hover:text-rose-600 bg-rose-50 p-1 rounded-md transition"
              title="Hapus pertanyaan ini"
            >
              <X className="w-4 h-4" />
            </button>
            <input
              type="text"
              className="font-semibold text-slate-700 text-sm w-full bg-transparent outline-none border-b border-dashed border-slate-300 focus:border-blue-500 pb-1 pr-8"
              placeholder="Ketik pertanyaan kustom di sini..."
              value={anamnesa[`${kKey}_label`] || ""}
              onChange={e => setAnaVal(`${kKey}_label`, e.target.value)}
            />
            <textarea
              rows={2}
              className="w-full text-sm p-3 mt-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 bg-slate-50"
              placeholder="Jawaban kandidat..."
              value={anamnesa[`${kKey}_ans`] || ""}
              onChange={e => setAnaVal(`${kKey}_ans`, e.target.value)}
            />
            <textarea
              rows={2}
              className="w-full text-sm p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 bg-blue-50/50"
              placeholder="Interpretasi psikolog..."
              value={anamnesa[`${kKey}_int`] || ""}
              onChange={e => setAnaVal(`${kKey}_int`, e.target.value)}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setCustomQKeys(p => [...p, `custom_${Date.now()}`])}
          className="w-full py-3 border-2 border-dashed border-blue-200 text-blue-600 rounded-xl font-semibold text-sm hover:bg-blue-50 transition"
        >
          + Tambah Pertanyaan Baru
        </button>
      </Section>

      {/* ── C. KESAN UMUM ───────────────────────────────────────────────────── */}
      <Section
        id="impression"
        icon={<Star className="w-5 h-5 text-amber-500" />}
        title="C. Kesan Umum Kandidat"
        subtitle="Rating 1–5 berdasarkan observasi langsung psikolog"
        color="amber"
      >
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
          ⭐ 1 = Sangat Kurang &nbsp;|&nbsp; 3 = Rata-rata &nbsp;|&nbsp; 5 = Sangat Baik
        </div>
        <RatingRow impKey="appearance" label="Penampilan & Kerapian" />
        <RatingRow impKey="communication" label="Kemampuan Komunikasi Verbal" />
        <RatingRow impKey="confidence" label="Kepercayaan Diri" />
        <RatingRow impKey="culturefit" label="Kesan Kesesuaian Kultur Organisasi" />

        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <p className="font-semibold text-slate-700 text-sm mb-2">Kesan Keseluruhan</p>
          <textarea
            rows={3}
            className="w-full text-sm p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 bg-slate-50"
            placeholder="Deskripsikan kesan umum psikolog terhadap kandidat secara holistik..."
            value={impression.overall || ""}
            onChange={e => setImpVal("overall", e.target.value)}
          />
        </div>
      </Section>

      {/* ── D. CATATAN BEBAS & RED FLAG ─────────────────────────────────────── */}
      <Section
        id="redflag"
        icon={<AlertTriangle className="w-5 h-5 text-rose-500" />}
        title="D. Red Flag & Catatan Klinis"
        subtitle="Inkonsistensi, hal tidak biasa, atau catatan penting psikolog"
        color="rose"
      >
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanda Klinis</p>
          <CheckItem stateKey="rf_inkonsisten" label="Inkonsistensi antara jawaban tes dan perilaku nyata" isWarning />
          <CheckItem stateKey="rf_emosi" label="Regulasi emosi yang kurang stabil saat wawancara" isWarning />
          <CheckItem stateKey="rf_bohong" label="Indikasi ketidakjujuran / manipulatif dalam menjawab" isWarning />
          <CheckItem stateKey="rf_risiko" label="Ada faktor risiko personal yang perlu perhatian lebih" isWarning />
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <p className="font-semibold text-slate-700 text-sm mb-2">Catatan Bebas Psikolog</p>
          <textarea
            rows={5}
            className="w-full text-slate-800 text-sm p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-rose-400 bg-white"
            placeholder="Red flag, inkonsistensi data, hal unik, atau informasi kontekstual yang penting untuk interpretasi AI..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
      </Section>

      {/* Save button bawah */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-bold shadow-md shadow-teal-100 disabled:opacity-50 transition-all"
        >
          {saving
            ? <RefreshCw className="w-4 h-4 animate-spin" />
            : saved
            ? <CheckCircle2 className="w-4 h-4" />
            : <Save className="w-4 h-4" />}
          {saving ? "Menyimpan..." : saved ? "Tersimpan!" : "Simpan Observasi"}
        </button>
      </div>
    </div>
  );
}
