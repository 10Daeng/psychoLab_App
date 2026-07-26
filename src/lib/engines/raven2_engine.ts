import { BaseTestEngine, AssessmentResult } from './base_engine';
const getCognitiveCategory = (qNum: number): "PROGRESSION" | "ROTATION" | "COMPLEX" => {
  const progression = [1, 2, 4, 6, 10, 14, 15, 17, 19, 20];
  const rotation = [3, 7, 13, 18, 23];
  if (progression.includes(qNum)) return "PROGRESSION";
  if (rotation.includes(qNum)) return "ROTATION";
  return "COMPLEX";
};

const speedAccuracyProfiles = {
  agile_thinker: {
    label: "⭐ Agile Thinker",
    description: "Cepat & Akurat — Pemikir yang gesit dan presisi tinggi",
    color: "#22c55e",
  },
  deliberate_analyst: {
    label: "🐢 Deliberate Analyst",
    description: "Lambat tapi Akurat — Analis yang deliberatif dan cermat",
    color: "#3b82f6",
  },
  impulsive: {
    label: "⚡ Impulsive",
    description: "Cepat tapi Sering Salah — Kecenderungan impulsif",
    color: "#f59e0b",
  },
  struggling: {
    label: "🔴 Struggling",
    description: "Lambat & Tidak Akurat — Memerlukan dukungan lebih",
    color: "#ef4444",
  },
};

const ravenNormTable: Record<number, number> = {
  0: 47, 1: 51, 2: 55, 3: 59, 4: 63, 5: 67, 6: 71, 7: 75,
  8: 79, 9: 83, 10: 87, 11: 91, 12: 95, 13: 99, 14: 103, 15: 107,
  16: 111, 17: 115, 18: 119, 19: 123, 20: 127, 21: 131, 22: 135,
  23: 139, 24: 148,
};

const BASELINE_AVERAGE_SECONDS = 50; // 50 detik per soal
const ACCURACY_HIGH_THRESHOLD = 0.75; // 75%

export interface Raven2Answer {
  question_id: number;
  answer?: string | number;
  time_taken_ms: number;
}

export class Raven2Engine extends BaseTestEngine {
  constructor() {
    super('RAVEN2');
  }

  // Fungsi untuk konversi IQ ke Persentil kasar (Mean=100, SD=15)
  private iqToPercentile(iq: number): number {
    if (iq >= 145) return 99;
    if (iq >= 130) return 98;
    if (iq >= 120) return 91;
    if (iq >= 115) return 84;
    if (iq >= 110) return 75;
    if (iq >= 100) return 50;
    if (iq >= 90) return 25;
    if (iq >= 85) return 16;
    if (iq >= 80) return 9;
    if (iq >= 70) return 2;
    return 1;
  }

  async calculateScores(answers: Raven2Answer[], clientData?: any): Promise<AssessmentResult> {
    const { supabaseAdmin: supabase } = await import('@/lib/supabase-admin');
    const { data: qData } = await supabase.from('questionnaires').select('id').eq('code', 'RAVEN2').single();
    
    let answerKey = new Map();
    if (qData) {
      const { data: questions } = await supabase.from('questions').select('question_number, correct_answer').eq('questionnaire_id', qData.id);
      questions?.forEach(q => answerKey.set(q.question_number, q.correct_answer));
    }

    let correctCount = 0;
    let totalTimeMs = 0;
    
    // Melacak akurasi berdasarkan kategori kognitif
    const categoryStats = {
      PROGRESSION: { total: 0, correct: 0 },
      ROTATION: { total: 0, correct: 0 },
      COMPLEX: { total: 0, correct: 0 }
    };

    answers.forEach(ans => {
      totalTimeMs += ans.time_taken_ms;
      
      const correctAnsStr = answerKey.get(ans.question_id);
      // ans.answer dari frontend berisi string pilihan, misal "1", "2", "3" (indeks + 1)
      const isCorrect = (ans as any).answer === correctAnsStr || String((ans as any).answer) === String(correctAnsStr);

      if (isCorrect) {
        correctCount++;
      }
      
      const cognitiveCat = getCognitiveCategory(ans.question_id);
      categoryStats[cognitiveCat].total++;
      if (isCorrect) categoryStats[cognitiveCat].correct++;
    });

    // Konversi Raw Score ke IQ berdasarkan Norm Table (Maksimal Raw Score 24)
    const rawBounded = Math.min(24, Math.max(0, correctCount));
    const iqScore = ravenNormTable[rawBounded] || 100;
    const percentile = this.iqToPercentile(iqScore);

    const avgTimeS = answers.length > 0 ? (totalTimeMs / answers.length) / 1000 : 0;
    
    // Penentuan Speed-Accuracy Matrix (Real Logic)
    const accuracy = correctCount / 24;
    const isAccurate = accuracy >= ACCURACY_HIGH_THRESHOLD; // > 75% (18/24)
    const isFast = avgTimeS < BASELINE_AVERAGE_SECONDS; // < 50s

    let profileObj = speedAccuracyProfiles.struggling;
    if (isAccurate && isFast) profileObj = speedAccuracyProfiles.agile_thinker;
    else if (isAccurate && !isFast) profileObj = speedAccuracyProfiles.deliberate_analyst;
    else if (!isAccurate && isFast) profileObj = speedAccuracyProfiles.impulsive;
    else if (!isAccurate && !isFast) profileObj = speedAccuracyProfiles.struggling;

    // Klasifikasi IQ Weschsler Standard
    let grade = 'Rata-rata';
    if (iqScore >= 130) grade = 'Sangat Superior';
    else if (iqScore >= 120) grade = 'Superior';
    else if (iqScore >= 110) grade = 'Rata-rata Atas';
    else if (iqScore >= 90) grade = 'Rata-rata';
    else if (iqScore >= 80) grade = 'Rata-rata Bawah';
    else grade = 'Kurang';

    return {
      rawScore: correctCount,
      percentile: percentile,
      calculatedData: {
        iq: iqScore,
        speed_accuracy_profile: profileObj.label,
        speed_accuracy_desc: profileObj.description,
        avg_time_seconds: avgTimeS.toFixed(1),
        category_breakdown: categoryStats
      },
      classification: grade
    };
  }

  buildAiPrompt(calculatedData: any, clientData: any): string {
    return `
Anda adalah seorang Psikolog.
Tugas Anda adalah membaca hasil tes Kognitif (Raven 2) dari kandidat dan memberikan laporan kecerdasannya.

DATA KANDIDAT:
- Nama: ${clientData?.name || 'Kandidat'}
- Estimasi IQ (Fluid Intelligence): ${calculatedData.iq}
- Profil Kecepatan vs Akurasi: ${calculatedData.speed_accuracy_profile}
- Rata-rata waktu per soal: ${calculatedData.avg_time_seconds} detik

INSTRUKSI:
Berikan analisis singkat terkait kapasitas kognitif (kemampuan memecahkan masalah baru tanpa mengandalkan pengalaman masa lalu) dan kelincahan berpikir kandidat berdasarkan Profil Kecepatan vs Akurasinya.

KEMBALIKAN DALAM FORMAT JSON SAJA:
{
  "cognitive_summary": "Penjelasan kapasitas kognitif dan nalar logis",
  "speed_accuracy_insight": "Wawasan mengenai cara dia bekerja (impulsif, metodis, dsb)"
}
`;
  }
}
