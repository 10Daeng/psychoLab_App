import React, { useState, useEffect } from 'react';

type AssessmentFormProps = {
  initialData?: any;
  onSave: (data: any) => void;
  isSaving: boolean;
  activeTab: string;
};

export default function AssessmentForm({ initialData, onSave, isSaving, activeTab }: AssessmentFormProps) {
  const [formData, setFormData] = useState<any>({
    checklist: {},
    notes: {},
    answers: {},
    interpretations: {}
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      checklist: { ...prev.checklist, [name]: checked }
    }));
  };

  const handleNote = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      notes: { ...prev.notes, [name]: value }
    }));
  };

  const handleAnswer = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      answers: { ...prev.answers, [name]: value }
    }));
  };

  const handleInterpretation = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      interpretations: { ...prev.interpretations, [name]: value }
    }));
  };

  const renderCheckbox = (id: string, label: string) => (
    <div className="flex items-center">
      <input
        type="checkbox"
        id={id}
        name={id}
        checked={!!formData.checklist[id]}
        onChange={handleCheckbox}
        className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
      />
      <label htmlFor={id} className="ml-2 text-sm text-slate-800">{label}</label>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 h-full flex flex-col">
      <div className="flex-1 space-y-8">
        
        {/* B. OBSERVASI PROSES */}
        <section className={`print:block print:break-inside-avoid print:mb-8 ${activeTab === 'B' ? 'block' : 'hidden'}`}>
          <h3 className="font-bold text-lg text-slate-700 mb-4 bg-slate-100 p-2 rounded">B. OBSERVASI PROSES (Kualitatif)</h3>
          
          <div className="mb-6 border p-4 rounded-lg">
            <label className="block font-semibold text-slate-800 mb-2">1. Atensi & Konsentrasi</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
              {renderCheckbox("obs_attn_optimal", "Fokus optimal")}
              {renderCheckbox("obs_attn_lelah", "Tampak lelah di akhir")}
              {renderCheckbox("obs_attn_minimal_distraction", "Distraksi minimal")}
            </div>
            <textarea
              name="obs_attn_interpretation"
              value={formData.notes.obs_attn_interpretation || ''}
              onChange={handleNote}
              rows={2}
              className="w-full p-2 border rounded-md text-sm"
              placeholder="Tulis interpretasi Anda untuk ATENSI..."
            />
          </div>

          <div className="mb-6 border p-4 rounded-lg">
            <label className="block font-semibold text-slate-800 mb-2">2. Pendekatan Problem-Solving</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
              {renderCheckbox("obs_solve_systematic", "Sistematis")}
              {renderCheckbox("obs_solve_double_check", "Double-check")}
              {renderCheckbox("obs_solve_instant_recognition", "Instant recognition")}
              {renderCheckbox("obs_solve_thoughtful", "Thoughtful")}
              {renderCheckbox("obs_solve_no_guessing", "Tidak menebak acak")}
              {renderCheckbox("obs_solve_no_impulsive", "Tidak impulsif")}
            </div>
            <textarea
              name="obs_solve_interpretation"
              value={formData.notes.obs_solve_interpretation || ''}
              onChange={handleNote}
              rows={2}
              className="w-full p-2 border rounded-md text-sm"
              placeholder="Tulis interpretasi Anda untuk PROBLEM-SOLVING..."
            />
          </div>

          <div className="mb-6 border p-4 rounded-lg">
            <label className="block font-semibold text-slate-800 mb-2">3. Respon Emosi & Motivasi</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
              {renderCheckbox("obs_emo_antusias", "Rileks & Antusias")}
              {renderCheckbox("obs_emo_persist", "Tetap Persist")}
              {renderCheckbox("obs_emo_verbalization", "Self-verbalization")}
              {renderCheckbox("obs_emo_intrinsic", "Motivasi intrinsik")}
              {renderCheckbox("obs_emo_no_dysregulation", "Tidak dysregulation")}
              {renderCheckbox("obs_emo_no_withdrawal", "Tidak give up")}
            </div>
            <textarea
              name="obs_emo_interpretation"
              value={formData.notes.obs_emo_interpretation || ''}
              onChange={handleNote}
              rows={2}
              className="w-full p-2 border rounded-md text-sm"
              placeholder="Tulis interpretasi Anda untuk EMOSI..."
            />
          </div>

          <div className="mb-6 border p-4 rounded-lg">
            <label className="block font-semibold text-slate-800 mb-2">4. Level Keyakinan</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
              {renderCheckbox("obs_conf_high_easy", "High (mudah)")}
              {renderCheckbox("obs_conf_moderate_mid", "Moderate (sedang)")}
              {renderCheckbox("obs_conf_questioning_hard", "Questioning (sulit)")}
              {renderCheckbox("obs_conf_realistic", "Realistis")}
              {renderCheckbox("obs_conf_no_anxiety", "Tidak self-doubt")}
            </div>
            <textarea
              name="obs_conf_interpretation"
              value={formData.notes.obs_conf_interpretation || ''}
              onChange={handleNote}
              rows={2}
              className="w-full p-2 border rounded-md text-sm"
              placeholder="Tulis interpretasi Anda untuk KEYAKINAN..."
            />
          </div>
        </section>

        {/* C. OBSERVASI PERILAKU */}
        <section className={`print:block print:break-inside-avoid print:mb-8 ${activeTab === 'C' ? 'block' : 'hidden'}`}>
          <h3 className="font-bold text-lg text-slate-700 mb-4 bg-slate-100 p-2 rounded">C. OBSERVASI PERILAKU (Work Habit)</h3>
          
          <div className="mb-6 border p-4 rounded-lg">
            <label className="block font-semibold text-slate-800 mb-2">5. Tempo Kerja (Pace)</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              {renderCheckbox("obs_pace_reflektif", "Reflektif")}
              {renderCheckbox("obs_pace_impulsif", "Impulsif")}
              {renderCheckbox("obs_pace_raguan", "Raguan")}
            </div>
            <textarea name="obs_pace_interpretation" value={formData.notes.obs_pace_interpretation || ''} onChange={handleNote} className="w-full p-2 border rounded-md text-sm" />
          </div>

          <div className="mb-6 border p-4 rounded-lg">
            <label className="block font-semibold text-slate-800 mb-2">6. Daya Tahan & Resiliensi</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              {renderCheckbox("obs_resilience_persisten", "Persisten")}
              {renderCheckbox("obs_resilience_menyerah", "Mudah Menyerah")}
              {renderCheckbox("obs_resilience_cemas", "Cemas")}
            </div>
            <textarea name="obs_resilience_interpretation" value={formData.notes.obs_resilience_interpretation || ''} onChange={handleNote} className="w-full p-2 border rounded-md text-sm" />
          </div>

          <div className="mb-6 border p-4 rounded-lg">
            <label className="block font-semibold text-slate-800 mb-2">7. Kepatuhan Instruksi</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              {renderCheckbox("obs_instr_sekali", "Memahami sekali jalan")}
              {renderCheckbox("obs_instr_ulang", "Butuh pengulangan")}
            </div>
            <textarea name="obs_instr_interpretation" value={formData.notes.obs_instr_interpretation || ''} onChange={handleNote} className="w-full p-2 border rounded-md text-sm" />
          </div>
          
          <div className="mb-6 border p-4 rounded-lg">
            <label className="block font-semibold text-slate-800 mb-2">8. Sikap Duduk & Atensi</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              {renderCheckbox("obs_duduk_tenang", "Tenang")}
              {renderCheckbox("obs_duduk_restless", "Restless")}
              {renderCheckbox("obs_duduk_toilet", "Izin toilet")}
            </div>
            <textarea name="obs_duduk_interpretation" value={formData.notes.obs_duduk_interpretation || ''} onChange={handleNote} className="w-full p-2 border rounded-md text-sm" />
          </div>

          <div className="mb-6 border p-4 rounded-lg">
            <label className="block font-semibold text-slate-800 mb-2">9. Kontak Mata & Interaksi</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              {renderCheckbox("obs_kontak_wajar", "Wajar")}
              {renderCheckbox("obs_kontak_menghindar", "Menghindar")}
            </div>
            <textarea name="obs_kontak_interpretation" value={formData.notes.obs_kontak_interpretation || ''} onChange={handleNote} className="w-full p-2 border rounded-md text-sm" />
          </div>

          <div className="mb-6 border p-4 rounded-lg">
            <label className="block font-semibold text-slate-800 mb-2">10. Separation (Jika diantar orang tua)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              {renderCheckbox("obs_sep_mandiri", "Mandiri")}
              {renderCheckbox("obs_sep_lengket", "Lengket")}
            </div>
            <textarea name="obs_sep_interpretation" value={formData.notes.obs_sep_interpretation || ''} onChange={handleNote} className="w-full p-2 border rounded-md text-sm" />
          </div>

        </section>

        {/* D. WAWANCARA ANAMNESA */}
        <section className={`print:block print:break-inside-avoid print:mb-8 ${activeTab === 'D' ? 'block' : 'hidden'}`}>
          <h3 className="font-bold text-lg text-slate-700 mb-4 bg-slate-100 p-2 rounded">D. WAWANCARA ANAMNESA SISWA</h3>
          
          <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <label className="block italic text-slate-800 mb-2 font-medium">Q6. Di sekolah yang lama, paling seru pas pelajaran apa? Kenapa suka itu?</label>
            <textarea name="interview_q6_answer" value={formData.answers.interview_q6_answer || ''} onChange={handleAnswer} className="w-full p-2 border rounded-md text-sm mb-2" placeholder="Jawaban anak..." />
            <textarea name="interview_q6_interpretation" value={formData.interpretations.interview_q6_interpretation || ''} onChange={handleInterpretation} className="w-full p-2 border rounded-md text-sm bg-blue-100" placeholder="Interpretasi..." />
          </div>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <label className="block italic text-slate-800 mb-2 font-medium">Q7. Kalau jam istirahat, biasanya ngapain? Main sama siapa?</label>
            <textarea name="interview_q7_answer" value={formData.answers.interview_q7_answer || ''} onChange={handleAnswer} className="w-full p-2 border rounded-md text-sm mb-2" />
            <textarea name="interview_q7_interpretation" value={formData.interpretations.interview_q7_interpretation || ''} onChange={handleInterpretation} className="w-full p-2 border rounded-md text-sm bg-blue-100" />
          </div>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <label className="block italic text-slate-800 mb-2 font-medium">Q8. Ada nggak teman yang bikin kamu sebel di sekolah lama? Kenapa?</label>
            <textarea name="interview_q8_answer" value={formData.answers.interview_q8_answer || ''} onChange={handleAnswer} className="w-full p-2 border rounded-md text-sm mb-2" />
            <textarea name="interview_q8_interpretation" value={formData.interpretations.interview_q8_interpretation || ''} onChange={handleInterpretation} className="w-full p-2 border rounded-md text-sm bg-blue-100" />
          </div>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <label className="block italic text-slate-800 mb-2 font-medium">Q9. Tahu nggak kenapa Ayah/Ibu ngajak pindah ke sekolah ini?</label>
            <textarea name="interview_q9_answer" value={formData.answers.interview_q9_answer || ''} onChange={handleAnswer} className="w-full p-2 border rounded-md text-sm mb-2" />
            <textarea name="interview_q9_interpretation" value={formData.interpretations.interview_q9_interpretation || ''} onChange={handleInterpretation} className="w-full p-2 border rounded-md text-sm bg-blue-100" />
          </div>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <label className="block italic text-slate-800 mb-2 font-medium">Q10. Gimana rasanya mau pindah sekolah? Senang, deg-degan, atau sedih?</label>
            <textarea name="interview_q10_answer" value={formData.answers.interview_q10_answer || ''} onChange={handleAnswer} className="w-full p-2 border rounded-md text-sm mb-2" />
            <textarea name="interview_q10_interpretation" value={formData.interpretations.interview_q10_interpretation || ''} onChange={handleInterpretation} className="w-full p-2 border rounded-md text-sm bg-blue-100" />
          </div>

        </section>

        {/* E. WAWANCARA KONFIRMASI TES */}
        <section className={`print:block print:break-inside-avoid print:mb-8 ${activeTab === 'E' ? 'block' : 'hidden'}`}>
          <h3 className="font-bold text-lg text-slate-700 mb-4 bg-slate-100 p-2 rounded">E. WAWANCARA KONFIRMASI TES</h3>
          
          <div className="mb-6 p-4 bg-purple-50 border border-purple-100 rounded-lg">
            <label className="block italic text-slate-800 mb-2 font-medium">Q1. Bagaimana menurut kamu tes tadi? Mudah atau susah?</label>
            <textarea name="interview_q1_answer" value={formData.answers.interview_q1_answer || ''} onChange={handleAnswer} className="w-full p-2 border rounded-md text-sm mb-2" />
            <textarea name="interview_q1_interpretation" value={formData.interpretations.interview_q1_interpretation || ''} onChange={handleInterpretation} className="w-full p-2 border rounded-md text-sm bg-purple-100" />
          </div>

          <div className="mb-6 p-4 bg-purple-50 border border-purple-100 rounded-lg">
            <label className="block italic text-slate-800 mb-2 font-medium">Q2. Kira-kira berapa yang kamu jawab benar dari 36?</label>
            <textarea name="interview_q2_answer" value={formData.answers.interview_q2_answer || ''} onChange={handleAnswer} className="w-full p-2 border rounded-md text-sm mb-2" />
            <textarea name="interview_q2_interpretation" value={formData.interpretations.interview_q2_interpretation || ''} onChange={handleInterpretation} className="w-full p-2 border rounded-md text-sm bg-purple-100" />
          </div>

          <div className="mb-6 p-4 bg-purple-50 border border-purple-100 rounded-lg">
            <label className="block italic text-slate-800 mb-2 font-medium">Q3. Bagaimana caranya kamu menjawab soal-soal ini?</label>
            <textarea name="interview_q3_answer" value={formData.answers.interview_q3_answer || ''} onChange={handleAnswer} className="w-full p-2 border rounded-md text-sm mb-2" />
            <textarea name="interview_q3_interpretation" value={formData.interpretations.interview_q3_interpretation || ''} onChange={handleInterpretation} className="w-full p-2 border rounded-md text-sm bg-purple-100" />
          </div>

          <div className="mb-6 p-4 bg-purple-50 border border-purple-100 rounded-lg">
            <label className="block italic text-slate-800 mb-2 font-medium">Q4. Capek tidak? Masih kuat lanjutan tidak?</label>
            <textarea name="interview_q4_answer" value={formData.answers.interview_q4_answer || ''} onChange={handleAnswer} className="w-full p-2 border rounded-md text-sm mb-2" />
            <textarea name="interview_q4_interpretation" value={formData.interpretations.interview_q4_interpretation || ''} onChange={handleInterpretation} className="w-full p-2 border rounded-md text-sm bg-purple-100" />
          </div>
          
          <div className="mb-6 p-4 bg-purple-50 border border-purple-100 rounded-lg">
            <label className="block italic text-slate-800 mb-2 font-medium">Q5. Tidur kamu kemarin cukup? Ada yang mengganggu fokus?</label>
            <textarea name="interview_q5_answer" value={formData.answers.interview_q5_answer || ''} onChange={handleAnswer} className="w-full p-2 border rounded-md text-sm mb-2" />
            <textarea name="interview_q5_interpretation" value={formData.interpretations.interview_q5_interpretation || ''} onChange={handleInterpretation} className="w-full p-2 border rounded-md text-sm bg-purple-100" />
          </div>
        </section>
        
        <div className="pt-6 mt-6 border-t border-slate-200 print:hidden">
          <button 
            onClick={() => onSave(formData)}
            disabled={isSaving}
            className="w-full py-4 text-lg bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 print:hidden shadow-lg shadow-blue-200 transition-all"
          >
            {isSaving ? 'Menyimpan Data...' : 'Simpan Perubahan'}
          </button>
        </div>

      </div>
    </div>
  );
}
