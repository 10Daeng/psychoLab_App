import { BaseTestEngine, AssessmentResult } from './base_engine';
import { calculateAdvancedMetrics } from '../cpm-analysis';

export class CpmEngine extends BaseTestEngine {
  constructor() {
    super('CPM');
  }

  async calculateScores(answers: any[], clientData?: any): Promise<AssessmentResult> {
    // 1. Fetch kunci jawaban dari Supabase
    const { supabase } = await import('@/lib/supabase');
    const { data: qData } = await supabase.from('questionnaires').select('id').eq('code', 'CPM').single();
    if (qData) {
      const { data: questions } = await supabase.from('questions').select('question_number, correct_answer').eq('questionnaire_id', qData.id);
      
      const answerKey = new Map();
      questions?.forEach((q: any) => answerKey.set(String(q.question_number), parseInt(q.correct_answer, 10)));
      
      // 2. Evaluasi jawaban peserta di backend!
      answers.forEach(ans => {
        const correctAns = answerKey.get(ans.questionId);
        ans.isFirstAttemptCorrect = (ans.firstAttemptAnswer === correctAns);
        if (ans.secondAttemptAnswer !== null && ans.secondAttemptAnswer !== undefined) {
          ans.isSecondAttemptCorrect = (ans.secondAttemptAnswer === correctAns);
        } else {
          ans.isSecondAttemptCorrect = false;
        }
      });
    }

    // 3. Menghitung umur desimal dari tanggal lahir
    let ageDecimal = 7.0;
    if (clientData && clientData.birth_date) {
      const birthDate = new Date(clientData.birth_date);
      const testDate = new Date();
      const diffTime = Math.abs(testDate.getTime() - birthDate.getTime());
      ageDecimal = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    }

    const clientName = clientData?.name || "Klien";
    
    // 4. Memanggil fungsi kalkulasi dari cpm-analysis.ts
    const calculatedData = calculateAdvancedMetrics(answers, ageDecimal, clientName);
    
    return {
      rawScore: calculatedData.totalRawScore,
      percentile: calculatedData.percentile,
      classification: String(calculatedData.level.level),
      calculatedData: calculatedData
    };
  }

  buildAiPrompt(calculatedData: any, clientData: any, parentData?: any, dapData?: any): string {
    const dataString = JSON.stringify(calculatedData, null, 2);
    const biodataString = JSON.stringify(clientData, null, 2);
    const parentContext = parentData ? `\nData/Observasi Orang Tua (Konteks Klinis): ${JSON.stringify(parentData)}` : "";
    const dapContext = dapData ? `\nHasil Skoring Grafis (Draw-A-Person): Kematangan Kognitif ${dapData.cognitive_maturity_level} (Skor: ${dapData.score}/73). Catatan Klinis Tester: ${dapData.clinical_notes || "Tidak ada catatan."}` : "";
    
    const name = clientData?.name || "Klien";
    const iq = calculatedData?.iq || 100;
    const percentile = calculatedData?.percentile || 50;

    return `Anda adalah psikolog anak senior. Tugas: Buat Laporan Hasil Pemeriksaan Psikologis MENDALAM berformat terstruktur untuk ${name}.

BIODATA KLIEN:
${biodataString}

HASIL KALKULASI TES (CPM):
${dataString}
${parentContext}
${dapContext}

PENTING TENTANG SKOR: 
- IQ: ${iq} | Persentil: ${percentile}. Gunakan skor ini untuk membahas kategori kecerdasan kognitif non-verbal.
- Jangan menyebut angka mentah berulang kali.

INSTRUKSI PENULISAN:
1. Profesional, hangat, deskriptif, JELAS, dan MUDAH DIPAHAMI.
2. Gunakan bahasa Indonesia yang NATURAL. HINDARI penyebutan angka berulang-ulang.
3. STRENGTH-BASED APPROACH: Gunakan KEKUATAN anak sebagai cara melatih kelemahannya.
4. JIKA ADA DATA DAP (Tes Grafis), padukan kesimpulan kematangan kognitif DAP dengan IQ CPM untuk merekomendasikan kesiapan masuk SD atau kelayakan kelas.

FORMAT OUTPUT WAJIB (PISAHKAN DENGAN BARIS KOSONG, TANPA MARKDOWN):

===DINAMIKA===
[4-5 Paragraf: Kapasitas Kognitif, Kekuatan Utama, Area Pengembangan, Kematangan Emosi, Penjelasan Dinamika Waktu/Kecepatan Kerja]

===KESIMPULAN===
${name} dikategorikan [MATANG/CUKUP MATANG/PERLU STIMULASI] untuk memasuki jenjang Sekolah Dasar. [Lanjutkan ringkasan 2 kalimat]

===REKOMENDASI===
**Di Rumah:**
- [Saran praktis 1]
- [Saran praktis 2]

**Di Sekolah:**
- [Saran praktis 1]
- [Saran praktis 2]

===CATATAN KHUSUS===
[Jika ada red flag dari data ortu/observasi, tuliskan di sini. Jika aman, tulis "Tidak ada catatan khusus yang mendesak."]
`;
  }
}
