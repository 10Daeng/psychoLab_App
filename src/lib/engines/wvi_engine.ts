import { BaseTestEngine, AssessmentResult } from './base_engine';

export interface WviAnswers {
  [itemNo: number]: number; // Rating 1-5
}

export class WviEngine extends BaseTestEngine {
  constructor() {
    super('WVI');
  }

  async calculateScores(answers: WviAnswers, clientData?: any): Promise<AssessmentResult> {
    const { supabaseAdmin: supabase } = await import('@/lib/supabase-admin');
    const { data: qData } = await supabase.from('questionnaires').select('id').eq('code', 'WVI').single();
    
    let dbQuestions: any[] = [];
    if (qData) {
      const { data: questions } = await supabase.from('questions').select('question_number, scoring_key').eq('questionnaire_id', qData.id);
      dbQuestions = questions || [];
    }

    // Initialize scores for categories based on db mapping
    const scores: Record<string, number> = {};
    let totalRawScore = 0;

    dbQuestions.forEach(q => {
      // Default to 3 (neutral) if not answered
      let val = answers[q.question_number] || 3;
      
      let catName = 'General';
      try {
         const sk = typeof q.scoring_key === 'string' ? JSON.parse(q.scoring_key) : q.scoring_key;
         if (sk && sk.category) catName = sk.category;
      } catch(e) {}

      if (!scores[catName]) scores[catName] = 0;
      scores[catName] += val;
      totalRawScore += val;
    });

    // Find the primary core value
    let primaryValue = "";
    let maxScore = -1;
    for (const [key, val] of Object.entries(scores)) {
       if (val > maxScore) {
         maxScore = val;
         primaryValue = key;
       }
    }

    return {
      rawScore: totalRawScore,
      calculatedData: {
        scores,
        primaryValue
      },
      classification: primaryValue
    };
  }

  buildAiPrompt(calculatedData: any, clientData: any): string {
    return `
Anda adalah seorang Psikolog Industri dan Organisasi (PIO).
Tugas Anda adalah membaca skor tes WVI (Work Value Inventory) dari kandidat pegawai dan memberikan laporan nilai-nilai kerjanya.

DATA KANDIDAT:
- Nama: ${clientData?.name || 'Kandidat'}
- Tata Nilai Dominan: ${calculatedData.primaryValue}
- Distribusi Skor (Skala max 15 per dimensi):
${JSON.stringify(calculatedData.scores, null, 2)}

INSTRUKSI:
Berdasarkan nilai dominan tersebut, berikan analisis singkat:
1. Motivasi utama kandidat dalam bekerja.
2. Lingkungan perusahaan seperti apa yang paling cocok (Culture Fit).
3. Potensi demotivasi.

KEMBALIKAN DALAM FORMAT JSON SAJA:
{
  "motivation": "Motivasi utamanya adalah...",
  "culture_fit": "Budaya perusahaan yang ideal adalah...",
  "demotivators": ["Hal 1 yang menurunkan semangat", "Hal 2"]
}
`;
  }
}
