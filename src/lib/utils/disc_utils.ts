// src/lib/utils/disc_utils.ts
// ============================================================================
// Utilitas Terpusat untuk Normalisasi dan Kalkulasi Skor DISC
// Satu sumber kebenaran (single source of truth) — tidak perlu copy-paste lagi.
// ============================================================================

export interface NormalizedDiscScore {
  D: number;
  I: number;
  S: number;
  C: number;
  discMost: { D: number; I: number; S: number; C: number };
  discLeast: { D: number; I: number; S: number; C: number };
  discComposite: { D: number; I: number; S: number; C: number };
  primary_trait: string;
  secondary_trait: string;
  pattern_key: string;
  archetype: string;
  is_valid: boolean;
  raw_scores?: any;
  [key: string]: any; // preserve extra fields
}

/**
 * Menghitung skor Most/Least/Composite dari jawaban mentah DISC.
 * Jawaban mentah = Record<number, { most?: string, least?: string }>
 */
function calculateFromRawAnswers(answers: Record<string, any>) {
  const vals = Object.values(answers);

  const dMost = vals.reduce((acc, a: any) => acc + (a.most === 'D' ? 1 : 0), 0);
  const iMost = vals.reduce((acc, a: any) => acc + (a.most === 'I' ? 1 : 0), 0);
  const sMost = vals.reduce((acc, a: any) => acc + (a.most === 'S' ? 1 : 0), 0);
  const cMost = vals.reduce((acc, a: any) => acc + (a.most === 'C' ? 1 : 0), 0);

  const dLeast = vals.reduce((acc, a: any) => acc + (a.least === 'D' ? 1 : 0), 0);
  const iLeast = vals.reduce((acc, a: any) => acc + (a.least === 'I' ? 1 : 0), 0);
  const sLeast = vals.reduce((acc, a: any) => acc + (a.least === 'S' ? 1 : 0), 0);
  const cLeast = vals.reduce((acc, a: any) => acc + (a.least === 'C' ? 1 : 0), 0);

  return {
    D: (dMost - dLeast) + 24,
    I: (iMost - iLeast) + 24,
    S: (sMost - sLeast) + 24,
    C: (cMost - cLeast) + 24,
    discMost: { D: dMost, I: iMost, S: sMost, C: cMost },
    discLeast: { D: dLeast, I: iLeast, S: sLeast, C: cLeast },
    discComposite: {
      D: (dMost - dLeast) + 24,
      I: (iMost - iLeast) + 24,
      S: (sMost - sLeast) + 24,
      C: (cMost - cLeast) + 24,
    },
  };
}

/**
 * Normalisasi skor DISC dari format apapun (lama/baru) menjadi
 * objek lengkap yang siap dipakai di semua komponen (Web, Print, PDF).
 *
 * @param calculatedScore - `discResult?.calculated_score` langsung dari database
 * @returns NormalizedDiscScore yang lengkap, atau null jika tidak ada data
 */
export function normalizeDiscScore(calculatedScore: any): NormalizedDiscScore | null {
  if (!calculatedScore) return null;

  // Ambil calculatedData (format engine baru) atau langsung dari root
  const data = calculatedScore.calculatedData || calculatedScore;

  // Jika sudah memiliki D/I/S/C sebagai number → format baru, langsung pakai
  if (typeof data.D === 'number' && typeof data.I === 'number') {
    return {
      ...data,
      D: data.D,
      I: data.I,
      S: data.S,
      C: data.C,
      discMost: data.discMost || { D: data.D, I: data.I, S: data.S, C: data.C },
      discLeast: data.discLeast || { D: data.D, I: data.I, S: data.S, C: data.C },
      discComposite: data.discComposite || { D: data.D, I: data.I, S: data.S, C: data.C },
      primary_trait: data.primary_trait || 'D',
      secondary_trait: data.secondary_trait || 'I',
      pattern_key: data.pattern_key || '',
      archetype: data.archetype || data.pattern || '-',
      is_valid: data.is_valid !== false,
    };
  }

  // Jika memiliki raw_scores (format lama) → hitung ulang dari jawaban mentah
  if (data.raw_scores && typeof data.raw_scores === 'object') {
    const calculated = calculateFromRawAnswers(data.raw_scores);
    return {
      ...data,
      ...calculated,
      primary_trait: data.primary_trait || 'D',
      secondary_trait: data.secondary_trait || 'I',
      pattern_key: data.pattern_key || '',
      archetype: data.archetype || data.pattern || '-',
      is_valid: data.is_valid !== false,
    };
  }

  // Fallback terakhir — tidak bisa dinormalisasi
  return null;
}

/**
 * Menghitung persentase bar DISC berdasarkan tipe grafik.
 *
 * - `composite`: rentang -24 s.d. +24 (skor sudah di-offset +24, jadi 0-48)
 * - `most` / `least`: rentang 0 s.d. 24
 *
 * @param raw - Skor mentah
 * @param type - Tipe grafik
 * @returns Persentase 0-100
 */
export function getDiscPct(raw: number, type: 'composite' | 'most' | 'least' = 'composite'): number {
  if (type === 'composite') {
    // Skor composite sudah offset +24, rentang 0-48
    return Math.max(0, Math.min(100, (raw / 48) * 100));
  }
  // Most dan Least, rentang 0-24
  return Math.max(0, Math.min(100, (raw / 24) * 100));
}
