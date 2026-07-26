import { BaseTestEngine, AssessmentResult } from './base_engine';

export interface VakAnswers {
  [itemNo: number]: string; // "Visual" | "Auditory" | "Kinesthetic"
}

export class VakEngine extends BaseTestEngine {
  constructor() {
    super('VAK');
  }

  async calculateScores(answers: VakAnswers, clientData?: any): Promise<AssessmentResult> {
    let visual = 0;
    let auditory = 0;
    let kinesthetic = 0;
    let totalScore = 0;

    for (const [key, value] of Object.entries(answers)) {
       totalScore++;
       if (value === "V" || value === "Visual") visual++;
       else if (value === "A" || value === "Auditory") auditory++;
       else if (value === "K" || value === "Kinesthetic") kinesthetic++;
    }

    // Determine dominant learning style
    let dominantStyle = "Visual";
    let maxScore = visual;
    
    if (auditory > maxScore) {
      dominantStyle = "Auditory";
      maxScore = auditory;
    }
    if (kinesthetic > maxScore) {
      dominantStyle = "Kinesthetic";
      maxScore = kinesthetic;
    }

    const calculatedData = {
      visual,
      auditory,
      kinesthetic,
      dominantStyle,
      totalAnswered: totalScore
    };

    return {
      rawScore: totalScore,
      calculatedData,
      classification: dominantStyle
    };
  }

  buildAiPrompt(calculatedData: any, clientData: any): string {
    return `
Anda adalah seorang Konselor Pendidikan.
Tugas Anda adalah membaca skor tes VAK (Gaya Belajar Visual, Auditory, Kinesthetic) dari siswa dan memberikan laporan gaya belajar.

DATA SISWA:
- Nama: ${clientData?.name || 'Siswa'}
- Skor Visual: ${calculatedData.visual}
- Skor Auditory: ${calculatedData.auditory}
- Skor Kinesthetic: ${calculatedData.kinesthetic}
- Gaya Belajar Dominan: ${calculatedData.dominantStyle}

INSTRUKSI:
Berdasarkan gaya belajar dominan tersebut, berikan analisis:
1. Penjelasan singkat tentang karakteristik gaya belajar dominannya.
2. Strategi belajar optimal (cara belajar yang paling efektif untuknya).
3. Tantangan belajar (hal yang biasanya membuatnya sulit fokus).

KEMBALIKAN DALAM FORMAT JSON SAJA:
{
  "summary": "Penjelasan karakteristik...",
  "strategies": ["Strategi 1", "Strategi 2"],
  "challenges": ["Tantangan 1", "Tantangan 2"]
}
`;
  }
}
