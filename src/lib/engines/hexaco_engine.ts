import { BaseTestEngine, AssessmentResult } from './base_engine';
export interface HexacoAnswers {
  [itemNo: number]: number; // answer 1 to 5
}

export class HexacoEngine extends BaseTestEngine {
  constructor() {
    super('HEXACO-100');
  }

  async calculateScores(answers: HexacoAnswers, clientData?: any): Promise<AssessmentResult> {
    const { supabaseAdmin: supabase } = await import('@/lib/supabase-admin');
    const { data: qData } = await supabase.from('questionnaires').select('id').eq('code', 'HEXACO').single();
    
    let dbQuestions: any[] = [];
    if (qData) {
      const { data: questions } = await supabase.from('questions').select('question_number, scoring_key').eq('questionnaire_id', qData.id);
      dbQuestions = questions || [];
    }

    let totalRawScore = 0;
    // H: Honesty, E: Emotionality, X: Extraversion, A: Agreeableness, C: Conscientiousness, O: Openness, Alt: Altruism
    const scores: Record<string, number> = { H: 0, E: 0, X: 0, A: 0, C: 0, O: 0, Alt: 0 };
    const counts: Record<string, number> = { H: 0, E: 0, X: 0, A: 0, C: 0, O: 0, Alt: 0 };
    
    // Validasi Straight-lining (Apakah kandidat menjawab angka yang sama untuk semua 100 soal?)
    const answerValues = Object.values(answers);
    let isStraightLining = false;
    if (answerValues.length >= 100) {
      const firstAnswer = answerValues[0];
      isStraightLining = answerValues.every(val => val === firstAnswer);
    }

    dbQuestions.forEach(q => {
      let val = answers[q.question_number];
      if (val === undefined) val = 3; // Default to neutral if missing

      // Parse scoring_key
      let facet = '';
      let isReverse = false;
      try {
         const sk = typeof q.scoring_key === 'string' ? JSON.parse(q.scoring_key) : q.scoring_key;
         facet = sk.facet || '';
         isReverse = sk.key === 'R';
      } catch(e) {}

      if (isReverse) {
        val = 6 - val;
      }
      totalRawScore += val;

      let dimKey = facet.charAt(0); // H, E, X, A, C, O
      if (facet.startsWith('Alt')) dimKey = 'Alt'; // Altruism

      if (scores[dimKey] !== undefined) {
        scores[dimKey] += val;
        counts[dimKey] += 1;
      }
    });

    const calculatedData: Record<string, any> = {};
    for (const key of Object.keys(scores)) {
      calculatedData[key] = counts[key] > 0 ? scores[key] / counts[key] : 0;
    }

    return {
      rawScore: totalRawScore,
      calculatedData: {
        ...calculatedData,
        is_valid: !isStraightLining,
        validation_warning: isStraightLining ? "Peringatan: Kandidat terdeteksi mengisi jawaban yang sama di semua soal (Straight-lining). Hasil tidak valid." : null
      },
      classification: isStraightLining ? 'Invalid' : 'Complete'
    };
  }

  buildAiPrompt(calculatedData: any, clientData: any): string {
    const warning = calculatedData.validation_warning ? `\n\n!!! PERHATIAN !!!\n${calculatedData.validation_warning}\nBerikan catatan khusus bahwa kandidat tidak mengisi tes dengan sungguh-sungguh.` : '';
    
    return `
Anda adalah seorang Psikolog Industri dan Organisasi (PIO).
Tugas Anda adalah membaca skor dimensi HEXACO dari kandidat karyawan dan memberikan laporan potensi integritas dan kepribadian.

DATA KANDIDAT:
- Nama: ${clientData?.name || 'Kandidat'}
- Status Validitas Tes: ${calculatedData.is_valid ? 'Valid' : 'TIDAK VALID'} ${warning}
- Skor HEXACO (Skala 1 - 5, di mana 5 sangat tinggi):
  - H (Honesty-Humility / Kejujuran & Integritas): ${calculatedData.H.toFixed(2)}
  - E (Emotionality / Stabilitas Emosi): ${calculatedData.E.toFixed(2)}
  - X (Extraversion / Sosial): ${calculatedData.X.toFixed(2)}
  - A (Agreeableness / Kerjasama Tim): ${calculatedData.A.toFixed(2)}
  - C (Conscientiousness / Tanggung Jawab & Detail): ${calculatedData.C.toFixed(2)}
  - O (Openness / Keterbukaan Inovasi): ${calculatedData.O.toFixed(2)}

INSTRUKSI:
Berdasarkan skor tersebut, berikan analisis singkat:
1. Ringkasan kepribadian utama dan Integritas kerjanya (terutama dari skor H dan C).
2. Kekuatan (Kelebihan) utama dalam lingkungan kerja.
3. Area Pengembangan (Kekurangan) yang perlu diwaspadai.

KEMBALIKAN DALAM FORMAT JSON SAJA:
{
  "summary": "Ringkasan kepribadian dan integritas...",
  "strengths": ["Kekuatan 1", "Kekuatan 2"],
  "weaknesses": ["Kelemahan 1", "Kelemahan 2"]
}
`;
  }
}
