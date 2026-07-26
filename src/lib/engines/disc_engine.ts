import { BaseTestEngine, AssessmentResult } from './base_engine';

export interface DiscAnswers {
  D: number;
  I: number;
  S: number;
  C: number;
}

export class DiscEngine extends BaseTestEngine {
  constructor() {
    super('DISC');
  }

  async calculateScores(answers: Record<number, { most?: string, least?: string }>, clientData?: any): Promise<AssessmentResult> {
    const D = Object.values(answers).reduce((acc, ans) => acc + (ans.most === 'D' ? 1 : 0) - (ans.least === 'D' ? 1 : 0), 0) + 24;
    const I = Object.values(answers).reduce((acc, ans) => acc + (ans.most === 'I' ? 1 : 0) - (ans.least === 'I' ? 1 : 0), 0) + 24;
    const S = Object.values(answers).reduce((acc, ans) => acc + (ans.most === 'S' ? 1 : 0) - (ans.least === 'S' ? 1 : 0), 0) + 24;
    const C = Object.values(answers).reduce((acc, ans) => acc + (ans.most === 'C' ? 1 : 0) - (ans.least === 'C' ? 1 : 0), 0) + 24;

    // 1. Determine aspects >= 30 (Based on the custom logic in disc_patterns.py)
    const aspects = [
      { trait: 'D', score: D },
      { trait: 'I', score: I },
      { trait: 'S', score: S },
      { trait: 'C', score: C }
    ];

    // Sort descending
    aspects.sort((a, b) => b.score - a.score);

    const highAspects = aspects.filter(a => a.score >= 30);
    
    let primary = 'D';
    let secondary = 'I';

    if (highAspects.length >= 2) {
      primary = highAspects[0].trait;
      secondary = highAspects[1].trait;
    } else if (highAspects.length === 1) {
      primary = highAspects[0].trait;
      secondary = highAspects[0].trait; // Pure pattern like DD
    } else {
      primary = aspects[0].trait;
      secondary = aspects[1].trait;
    }

    const patternKey = primary + secondary;
    
    // Mapping 15 patterns
    const patterns: Record<string, string> = {
      'DI': 'The Inspirational Pattern',
      'ID': 'The Inspirational Pattern',
      'DS': 'The Developer Pattern',
      'SD': 'The Developer Pattern',
      'DC': 'The Creative Pattern',
      'CD': 'The Creative Pattern',
      'IS': 'The Counselor Pattern',
      'SI': 'The Counselor Pattern',
      'IC': 'The Persuader Pattern',
      'CI': 'The Persuader Pattern',
      'SC': 'The Specialist Pattern',
      'CS': 'The Specialist Pattern',
      'DD': 'The Results Driver',
      'II': 'The Promoter',
      'SS': 'The Supporter',
      'CC': 'The Analyst'
    };

    const patternName = patterns[patternKey] || 'The Professional';
    
    // Validasi Sederhana: Memastikan ada variasi skor (kandidat tidak asal pilih netral/asal-asalan)
    const isInvalid = D === 0 && I === 0 && S === 0 && C === 0;

    return {
      rawScore: D + I + S + C,
      calculatedData: {
        raw_scores: answers,
        primary_trait: primary,
        secondary_trait: secondary,
        pattern_key: patternKey,
        archetype: patternName,
        is_valid: !isInvalid,
        validation_warning: isInvalid ? "Tes tidak valid karena tidak ada kecenderungan gaya perilaku." : null
      },
      classification: isInvalid ? 'Invalid' : patternName
    };
  }

  buildAiPrompt(calculatedData: any, clientData: any): string {
    const warning = calculatedData.validation_warning ? `\n\n!!! PERHATIAN !!!\n${calculatedData.validation_warning}\nBerikan catatan khusus bahwa kandidat tidak mengisi tes dengan sungguh-sungguh.` : '';
    
    return `
Anda adalah seorang Psikolog Industri dan Organisasi (PIO).
Tugas Anda adalah membaca hasil tes DISC dari kandidat karyawan dan memberikan laporan potensi kinerja dan kepemimpinannya.

DATA KANDIDAT:
- Nama: ${clientData?.name || 'Kandidat'}
- Status Validitas Tes: ${calculatedData.is_valid ? 'Valid' : 'TIDAK VALID'} ${warning}
- Arketipe DISC: ${calculatedData.archetype} (Kombinasi ${calculatedData.pattern_key})
- Skor Mentah: Dominance=${calculatedData.raw_scores.D}, Influence=${calculatedData.raw_scores.I}, Steadiness=${calculatedData.raw_scores.S}, Compliance=${calculatedData.raw_scores.C}

INSTRUKSI:
Berdasarkan Arketipe DISC tersebut, berikan analisis singkat:
1. Gaya Komunikasi dan Kepemimpinan.
2. Lingkungan kerja ideal (Kondisi di mana ia paling produktif).
3. Potensi tantangan jika berada di bawah tekanan kerja.

KEMBALIKAN DALAM FORMAT JSON SAJA:
{
  "communication_style": "Penjelasan gaya komunikasi dan kepemimpinan",
  "ideal_environment": "Lingkungan kerja ideal",
  "under_pressure": "Perilaku di bawah tekanan"
}
`;
  }
}
