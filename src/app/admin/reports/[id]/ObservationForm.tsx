import React, { useState } from 'react';
import { Save, RefreshCw, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

export default function ObservationForm({ initialData, onSave }: { initialData: any, onSave: (data: string) => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('atensi');

  let parsed = { notes: '', observation: {} as any, interview: {} as any };
  try {
    if (initialData && typeof initialData === 'object') {
      parsed = { ...parsed, ...initialData };
    } else if (initialData && typeof initialData === 'string' && initialData.startsWith('{')) {
      parsed = JSON.parse(initialData);
    } else {
      parsed.notes = initialData || '';
    }
  } catch (e) {
    parsed.notes = initialData || '';
  }

  const [notes, setNotes] = useState(parsed.notes || '');
  const [obs, setObs] = useState<any>(parsed.observation || {});
  const [inv, setInv] = useState<any>(parsed.interview || {});

  const handleObsCheck = (group: string, key: string, value: boolean) => {
    setObs((prev: any) => ({ ...prev, [group]: { ...prev[group], [key]: value } }));
  };

  const handleObsText = (group: string, text: string) => {
    setObs((prev: any) => ({ ...prev, [group]: { ...prev[group], notes: text } }));
  };

  const handleInv = (key: string, value: string) => {
    setInv((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const dataToSave = JSON.stringify({ notes, observation: obs, interview: inv });
    await onSave(dataToSave);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const Checkbox = ({ group, item }: { group: string, item: any }) => {
    const isChecked = !!obs[group]?.[item.id];
    return (
      <div className="flex flex-col mb-1.5 p-1.5 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 mt-0.5 text-teal-600 rounded border-slate-300 flex-shrink-0"
                 checked={isChecked} onChange={(e) => handleObsCheck(group, item.id, e.target.checked)} />
          <span className="text-sm text-slate-700 leading-snug">
            {item.isWarning && <span className="mr-1">⚠️</span>}
            {item.label}
          </span>
        </label>
        
        {isChecked && (item.hasIntensity || item.hasItemNumber) && (
          <div className="ml-6 mt-2 flex flex-wrap gap-4 text-[11px] text-slate-600 bg-slate-100/50 p-2 rounded border border-slate-200/60">
            {item.hasIntensity && (
              <div className="flex items-center gap-2">
                <span className="font-semibold italic">{item.intensityLabel || "Intensitas:"}</span>
                {['Ringan', 'Sedang', 'Berat'].map(lvl => (
                  <label key={lvl} className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" name={`${group}_${item.id}_intensity`} className="w-3 h-3 text-teal-600"
                           checked={obs[group]?.[`${item.id}_intensity`] === lvl}
                           onChange={() => handleObsCheck(group, `${item.id}_intensity`, lvl as any)} />
                    {lvl}
                  </label>
                ))}
              </div>
            )}
            
            {item.hasIntensity && item.hasItemNumber && <span className="text-slate-300">|</span>}
            
            {item.hasItemNumber && (
              <div className="flex items-center gap-2">
                <span className="font-semibold italic">{item.itemNumberLabel || "Mulai terlihat sekitar soal #:"}</span>
                <input type="text" className="w-12 px-1 py-0.5 text-center border-b border-slate-300 bg-transparent outline-none focus:border-teal-500 font-medium"
                       value={obs[group]?.[`${item.id}_itemNum`] || ''}
                       onChange={(e) => handleObsCheck(group, `${item.id}_itemNum`, e.target.value as any)}
                       placeholder="..." />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const ObsSection = ({ title, group, items, color = "teal" }: { title: string, group: string, items: any[], color?: string }) => {
    const isOpen = expandedSection === group;
    const checkedCount = items.filter(i => obs[group]?.[i.id]).length;
    const hasNotes = !!obs[group]?.notes;
    
    return (
      <div className={`border rounded-xl bg-white shadow-sm overflow-hidden transition-all ${isOpen ? 'border-teal-300' : 'border-slate-200'}`}>
        <button
          type="button"
          onClick={() => setExpandedSection(isOpen ? null : group)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-800">{title}</span>
            {(checkedCount > 0 || hasNotes) && (
              <span className="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-semibold">
                {checkedCount} ✓{hasNotes ? ' + catatan' : ''}
              </span>
            )}
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        
        {isOpen && (
          <div className="px-4 pb-4">
            <div className="flex flex-col gap-1 mb-3">
              {items.map(item => <Checkbox key={item.id} group={group} item={item} />)}
            </div>
            <textarea
              placeholder={`Interpretasi klinis untuk ${title}...`} rows={2}
              className="w-full text-sm p-3 border border-slate-200 rounded-lg focus:ring-1 focus:ring-teal-500 outline-none bg-slate-50"
              value={obs[group]?.notes || ''} onChange={(e) => handleObsText(group, e.target.value)}
            />
          </div>
        )}
      </div>
    );
  };

  const InterviewQ = ({ q, label, hint }: { q: string, label: string, hint?: string }) => (
    <div className="mb-4 p-4 border border-slate-200 rounded-xl bg-white">
      <label className="block font-semibold text-slate-800 text-sm mb-0.5">{label}</label>
      {hint && <p className="text-xs text-slate-400 mb-2 italic">{hint}</p>}
      <textarea placeholder="Jawaban peserta..." rows={2} className="w-full text-sm p-3 mb-2 border border-slate-200 rounded-lg outline-none focus:border-blue-400"
        value={inv[`${q}Ans`] || ''} onChange={(e) => handleInv(`${q}Ans`, e.target.value)} />
      <textarea placeholder="Interpretasi klinis psikolog..." rows={2} className="w-full text-sm p-3 border border-slate-200 rounded-lg outline-none bg-slate-50 focus:border-blue-400"
        value={inv[`${q}Notes`] || ''} onChange={(e) => handleInv(`${q}Notes`, e.target.value)} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Form Observasi & Wawancara Psikolog</h2>
          <p className="text-sm text-slate-500">Isi checklist dan catatan untuk keperluan laporan PDF Mode Guru/Lengkap.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-teal-100 disabled:opacity-50">
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : (saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />)}
          {saving ? 'Menyimpan...' : (saved ? 'Tersimpan!' : 'Simpan Form')}
        </button>
      </div>

      {/* BAGIAN A: OBSERVASI PROSES (10 dimensi dari CPM-App) */}
      <div className="space-y-2">
        <div className="flex flex-col gap-1 bg-teal-50 p-3 rounded-lg border border-teal-100">
          <span className="text-teal-700 font-bold text-sm">A. Observasi Proses Psikologis (Klik untuk buka/tutup)</span>
          <span className="text-teal-600/80 text-xs italic">Centang semua yang sesuai. Untuk item bertanda ⚠️, tambahkan intensitas dan/atau nomor soal saat tanda mulai muncul.</span>
        </div>

        <ObsSection title="1. Atensi & Konsentrasi" group="atensi" items={[
          {id: 'optimal', label: 'Fokus optimal sepanjang sesi'},
          {id: 'lelah', label: 'Tampak lelah/mengantuk di akhir sesi', isWarning: true, hasIntensity: true, hasItemNumber: true},
          {id: 'minimal', label: 'Distraksi minimal (tidak mudah terganggu suara luar)'},
        ]} />
        
        <ObsSection title="2. Pendekatan Problem-Solving" group="problemSolving" items={[
          {id: 'sistematis', label: 'Sistematis (membandingkan semua opsi sebelum menjawab)'},
          {id: 'doubleCheck', label: 'Melakukan double-check (melihat ulang jawaban)'},
          {id: 'instantRecognition', label: 'Instant recognition pada item mudah (cepat dan benar)'},
          {id: 'thoughtful', label: 'Thoughtful pada item sulit (berpikir, tidak asal jawab)'},
          {id: 'noGuessing', label: 'Tidak menebak acak (ada pola/strategi jelas)'},
          {id: 'noImpulsive', label: 'Tidak impulsif (tidak langsung tunjuk tanpa lihat pola)'},
        ]} />

        <ObsSection title="3. Respon Emosi & Motivasi" group="emosi" items={[
          {id: 'antusias', label: 'Rileks & antusias saat mengerjakan'},
          {id: 'persist', label: 'Tetap persist pada item sulit (tidak langsung menyerah)'},
          {id: 'verbalization', label: 'Self-verbalization: "hmm..", berbicara sendiri saat berpikir'},
          {id: 'intrinsik', label: 'Motivasi intrinsik (tidak minta pujian/validasi penguji)'},
          {id: 'dysregulation', label: 'Ada dysregulation emosi (marah, menangis, frustrasi berlebih)', isWarning: true, hasIntensity: true},
          {id: 'withdrawal', label: 'Give-up/withdrawal saat menghadapi kesulitan', isWarning: true},
        ]} />

        <ObsSection title="4. Level Keyakinan (Confidence)" group="keyakinan" items={[
          {id: 'highEasy', label: 'High confidence pada item mudah (langsung yakin)'},
          {id: 'moderateMid', label: 'Moderate confidence pada item sedang'},
          {id: 'questioningHard', label: 'Questioning/ragu pada item sulit (wajar)'},
          {id: 'realistis', label: 'Terkalibrasi/realistis (tahu mana yang yakin dan mana tidak)'},
          {id: 'noAnxiety', label: 'Tidak ada self-doubt berlebih'},
        ]} />

        <ObsSection title="5. Tempo Kerja (Pace) — pilih salah satu" group="tempo" items={[
          {id: 'reflektif', label: 'Reflektif: mengamati pola dulu, baru menjawab'},
          {id: 'impulsif', label: 'Impulsif: langsung menunjuk tanpa lihat pola (cepat tapi ceroboh)'},
          {id: 'raguan', label: 'Raguan: sering mengganti-ganti jawaban atau tampak tidak yakin', hasItemNumber: true, itemNumberLabel: 'Jika berubah di tengah sesi, catat sekitar soal #:'},
        ]} />

        <ObsSection title="6. Daya Tahan & Resiliensi — pilih salah satu" group="resiliensi" items={[
          {id: 'persisten', label: 'Persisten: tetap berusaha mencari pola meski item makin sulit (Set B)'},
          {id: 'menyerah', label: 'Mudah menyerah: mengatakan "susah", "tidak tahu", atau asal tunjuk', isWarning: true, hasIntensity: true, hasItemNumber: true},
          {id: 'cemas', label: 'Cemas: gelisah, menoleh ke penguji, memainkan jari saat bingung', isWarning: true, hasIntensity: true},
        ]} />

        <ObsSection title="7. Kepatuhan Instruksi" group="instruksi" items={[
          {id: 'sekali', label: 'Mampu memahami instruksi sekali jalan'},
          {id: 'ulang', label: 'Butuh pengulangan instruksi berkali-kali'},
          {id: 'klarifikasi', label: 'Aktif bertanya klarifikasi (tanda engagement yang baik)'},
        ]} />

        <ObsSection title="8. Sikap Duduk & Atensi Fisik" group="sikap" items={[
          {id: 'tenang', label: 'Tenang dan fokus sepanjang waktu'},
          {id: 'restless', label: 'Restless: banyak gerak, kaki bergoyang, menunduk terlalu dekat', isWarning: true, hasIntensity: true},
          {id: 'toilet', label: 'Sering izin ke toilet (indikasi gangguan atensi atau kecemasan)', isWarning: true},
        ]} />

        <ObsSection title="9. Kontak Mata & Interaksi" group="kontakMata" items={[
          {id: 'wajar', label: 'Kontak mata wajar dan nyaman saat bicara dengan penguji'},
          {id: 'menghindar', label: 'Menghindar/menunduk terus (indikasi insecure atau cemas berlebih)', isWarning: true},
          {id: 'berlebihan', label: 'Kontak mata berlebihan/staring (perlu observasi lebih lanjut)', isWarning: true},
        ]} />

        <ObsSection title="10. Separation (Jika diantar orang tua)" group="separation" items={[
          {id: 'mandiri', label: 'Berani masuk ruang tes sendiri tanpa dampingan orang tua'},
          {id: 'lengket', label: 'Masih "lengket"/sulit berpisah dengan orang tua (ketidakmatangan emosi)', isWarning: true},
          {id: 'adaptif', label: 'Awalnya minta ditemani tapi cepat beradaptasi'},
        ]} />
      </div>

      {/* BAGIAN B: WAWANCARA ANAMNESA */}
      <div className="space-y-2">
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
          <p className="text-blue-700 font-bold text-sm">B. Wawancara Anamnesa Siswa</p>
          <p className="text-blue-500 text-xs mt-0.5">Gunakan bahasa santai. Tiap pertanyaan: tulis jawaban anak + interpretasi klinis.</p>
        </div>

        <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">📚 1. Adaptasi Sekolah & Sosial</p>
        </div>
        <InterviewQ q="q6" label="&quot;Di sekolah, paling seru pas pelajaran apa? Kenapa suka itu?&quot;" hint="Mengecek minat & persepsi terhadap belajar" />
        <InterviewQ q="q7" label="&quot;Kalau jam istirahat, biasanya ngapain? Main sama siapa?&quot;" hint="Mendeteksi anak penyendiri vs anak sosial" />
        <InterviewQ q="q8" label="&quot;Ada nggak teman yang bikin kamu sebel di sekolah? Kenapa?&quot;" hint="Mendeteksi potensi konflik atau bullying" />

        <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">🏠 2. Kemandirian Belajar</p>
        </div>
        <InterviewQ q="q11" label="&quot;Kalau di rumah belajar ditemani Ibu/Ayah, atau belajar sendiri?&quot;" />
        <InterviewQ q="q12" label="&quot;Kalau ada PR yang susah, biasanya kamu ngapain?&quot;" hint="Menggali problem-solving skill dan resiliensi" />

        <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">🎯 3. Motivasi & Cita-cita</p>
        </div>
        <InterviewQ q="q14" label="&quot;Kalau sudah besar nanti, mau jadi apa? Kenapa?&quot;" hint="Mengecek minat karir & motivasi intrinsik" />
        <InterviewQ q="q15" label="&quot;Pelajaran apa yang paling kamu kuasai? Pelajaran apa yang paling susah?&quot;" hint="Self-awareness akademis" />

        <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">🧪 4. Konfirmasi Tes</p>
        </div>
        <InterviewQ q="q1" label="&quot;Bagaimana menurut kamu tes tadi? Mudah atau susah?&quot;" hint="Menggali self-assessment & validitas tes" />
        <InterviewQ q="q2" label="&quot;Kira-kira berapa yang kamu jawab benar dari 36?&quot;" hint="Estimasi akurasi vs skor aktual → metacognition" />
        <InterviewQ q="q3" label="&quot;Bagaimana caranya kamu menjawab soal-soal ini?&quot;" hint="Menggali strategi/gaya berpikir" />
        <InterviewQ q="q4" label="&quot;Capek tidak? Masih kuat tidak?&quot;" hint="Mendeteksi kelelahan yang mempengaruhi skor" />
        <InterviewQ q="q5" label="&quot;Tidur kamu kemarin cukup? Ada yang mengganggu fokus hari ini?&quot;" hint="Validitas kondisi fisik saat tes" />
      </div>

      {/* BAGIAN C: DRAW A PERSON (DAP) */}
      <div className="space-y-2 pt-2">
        <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex items-center justify-between">
          <div>
            <p className="text-orange-700 font-bold text-sm">C. Observasi Tes Menggambar (DAP)</p>
            <p className="text-orange-500 text-xs mt-0.5">Analisis proyeksi kepribadian dari grafis (Draw A Person).</p>
          </div>
        </div>

        <ObsSection title="Indikator Grafis DAP" group="dap" items={[
          {id: 'proporsional', label: 'Ukuran proporsional & letak proporsional (wajar di tengah)'},
          {id: 'tegas', label: 'Tarikan garis tegas, lancar & yakin (tidak terputus/ragu)'},
          {id: 'detail', label: 'Detail tubuh lengkap (kepala, badan, tangan, kaki, fitur wajah)'},
          {id: 'hapusan', label: 'Terlalu banyak hapusan/koreksi (indikasi kecemasan/keraguan)'},
          {id: 'kecil', label: 'Gambar terlalu kecil atau di pojok (indikasi insecure/menarik diri)'},
          {id: 'tekanan', label: 'Tekanan garis terlalu kuat/tajam (indikasi agresivitas/ketegangan)'},
        ]} />
      </div>

      {/* BAGIAN D: CATATAN BEBAS */}
      <div className="space-y-2 pt-2">
        <h3 className="font-bold text-purple-700 bg-purple-50 p-3 rounded-lg border border-purple-100 text-sm">
          D. Catatan Bebas & Red Flag (Psikolog)
        </h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:border-purple-400 text-sm"
          placeholder="Catatan bebas tambahan, red flag, hal-hal unik yang perlu dicatat dalam laporan..."
        />
      </div>

    </div>
  );
}
