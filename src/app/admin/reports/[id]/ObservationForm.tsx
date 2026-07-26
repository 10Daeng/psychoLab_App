import React, { useState } from 'react';
import { Save, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function ObservationForm({ initialData, onSave }: { initialData: any, onSave: (data: string) => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Parse initialData (bisa string biasa peninggalan lama, atau JSON string)
  let parsed = { notes: '', observation: {} as any, interview: {} as any };
  try {
    if (initialData && typeof initialData === 'string' && initialData.startsWith('{')) {
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

  const Checkbox = ({ group, id, label }: { group: string, id: string, label: string }) => (
    <label className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
      <input type="checkbox" className="w-4 h-4 text-teal-600 rounded border-slate-300" 
             checked={!!obs[group]?.[id]} onChange={(e) => handleObsCheck(group, id, e.target.checked)} />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );

  const ObsSection = ({ title, group, items }: { title: string, group: string, items: {id:string, label:string}[] }) => (
    <div className="mb-6 p-4 border border-slate-200 rounded-xl bg-white shadow-sm">
      <h3 className="text-sm font-bold text-slate-800 mb-3">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
        {items.map(item => <Checkbox key={item.id} group={group} id={item.id} label={item.label} />)}
      </div>
      <textarea
        placeholder={`Interpretasi untuk ${title}...`} rows={2}
        className="w-full text-sm p-3 border border-slate-200 rounded-lg focus:ring-1 focus:ring-teal-500 outline-none"
        value={obs[group]?.notes || ''} onChange={(e) => handleObsText(group, e.target.value)}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Form Observasi & Wawancara Psikolog</h2>
          <p className="text-sm text-slate-500">Isi checklist dan catatan untuk keperluan laporan PDF khusus Mode Guru.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-teal-100 disabled:opacity-50">
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : (saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />)}
          {saving ? 'Menyimpan...' : (saved ? 'Tersimpan!' : 'Simpan Form')}
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-teal-700 bg-teal-50 p-3 rounded-lg border border-teal-100">A. Observasi Proses (Kualitatif)</h3>
        <ObsSection title="1. Atensi & Konsentrasi" group="atensi" items={[
          {id: 'optimal', label: 'Fokus optimal'}, {id: 'lelah', label: 'Tampak lelah di akhir'}, {id: 'minimal', label: 'Distraksi minimal'}
        ]} />
        <ObsSection title="2. Problem-Solving" group="problemSolving" items={[
          {id: 'sistematis', label: 'Sistematis'}, {id: 'doubleCheck', label: 'Melakukan double-check'}, {id: 'impulsif', label: 'Impulsif/Menebak Acak'}
        ]} />
        <ObsSection title="3. Respon Emosi & Motivasi" group="emosi" items={[
          {id: 'antusias', label: 'Rileks & Antusias'}, {id: 'persist', label: 'Tetap Persist (item sulit)'}, {id: 'withdraw', label: 'Menyerah (Withdrawal)'}
        ]} />
        <ObsSection title="4. Tempo Kerja (Pace)" group="tempo" items={[
          {id: 'reflektif', label: 'Reflektif (mengamati dulu)'}, {id: 'impulsif', label: 'Sangat Cepat & Ceroboh'}, {id: 'ragu', label: 'Raguan (Sering ganti jawaban)'}
        ]} />
        <ObsSection title="5. Sikap Duduk & Kontak Mata" group="sikap" items={[
          {id: 'tenang', label: 'Tenang dan fokus'}, {id: 'restless', label: 'Restless (Banyak gerak)'}, {id: 'kontakWajar', label: 'Kontak mata wajar'}
        ]} />
      </div>

      <div className="space-y-4 mt-8">
        <h3 className="font-bold text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-100">B. Wawancara Anamnesa & Konfirmasi</h3>
        
        {[{q: 'q1', text: 'Bagaimana menurut kamu tes tadi? Mudah atau susah?'},
          {q: 'q2', text: 'Kalau jam istirahat sekolah, biasanya ngapain? Main sama siapa?'},
          {q: 'q3', text: 'Pelajaran apa yang paling kamu sukai / kuasai?'}
        ].map(item => (
          <div key={item.q} className="mb-4 p-4 border border-slate-200 rounded-xl bg-white">
            <label className="block font-semibold text-slate-800 text-sm mb-2">{item.text}</label>
            <textarea placeholder="Jawaban peserta..." rows={2} className="w-full text-sm p-3 mb-2 border border-slate-200 rounded-lg outline-none focus:border-blue-400"
              value={inv[`${item.q}Ans`] || ''} onChange={(e) => handleInv(`${item.q}Ans`, e.target.value)} />
            <textarea placeholder="Interpretasi klinis..." rows={2} className="w-full text-sm p-3 border border-slate-200 rounded-lg outline-none bg-slate-50 focus:border-blue-400"
              value={inv[`${item.q}Notes`] || ''} onChange={(e) => handleInv(`${item.q}Notes`, e.target.value)} />
          </div>
        ))}
      </div>

      <div className="space-y-4 mt-8">
        <h3 className="font-bold text-purple-700 bg-purple-50 p-3 rounded-lg border border-purple-100">C. Catatan Bebas (Tambahan Psikolog)</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:border-purple-400 text-sm"
          placeholder="Catatan tambahan bebas untuk di-print di halaman paling akhir (Mode Lengkap)..."
        />
      </div>

    </div>
  );
}
