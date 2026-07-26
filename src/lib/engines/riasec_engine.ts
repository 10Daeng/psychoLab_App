import { BaseTestEngine, AssessmentResult } from './base_engine';
import { scoreSds } from '../sds/engine';
import { type SdsAnswerMap } from '../sds/types';
import { findOccupationsBySdsCode, type OccupationMatch } from '../sds/occupation-finder';

export class RiasecEngine extends BaseTestEngine {
  constructor() {
    super('RIASEC');
  }

  async calculateScores(answers: SdsAnswerMap, clientData?: any): Promise<AssessmentResult> {
    // 1. Fetch metadata soal dari database (untuk menggantikan fallback ke SDS_ITEMS statis)
    const { supabase } = await import('@/lib/supabase');
    const { data: qData } = await supabase.from('questionnaires').select('id').eq('code', 'SDS').single();
    
    let dbItems: any[] = [];
    if (qData) {
      const { data: questions } = await supabase.from('questions').select('id, question_text, response_options').eq('questionnaire_id', qData.id);
      dbItems = (questions || []).map(q => {
        let opts = {} as any;
        try { opts = JSON.parse(q.response_options); } catch (e) {}
        return {
          id: opts.originalId || String(q.id),
          section: opts.section || opts.category || 'activities',
          code: opts.code,
          text: q.question_text,
          scoringType: opts.scoringType,
          minValue: opts.minValue,
          maxValue: opts.maxValue
        };
      });
    }

    // Membungkus logika scoreSds dari pustaka SDS Nextjs menggunakan item dinamis
    const sdsResult = scoreSds({ answers, items: dbItems.length > 0 ? dbItems : undefined });
    
    // Cari rekomendasi pekerjaan untuk primary code dan semua alternative code
    const codesToSearch = [sdsResult.summaryCode, ...(sdsResult.codeResolution?.alternativeSummaryCodes || [])];
    const occupationsMap = new Map<string, OccupationMatch>();
    
    for (const code of codesToSearch) {
      if (code) {
        const matches = findOccupationsBySdsCode(code, { limit: 15 });
        for (const match of matches) {
           if (!occupationsMap.has(match.id)) {
             occupationsMap.set(match.id, match);
           }
        }
      }
    }
    
    // Urutkan ulang berdasarkan matchScore dan skillLevel
    const recommendedOccupations = Array.from(occupationsMap.values()).sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return a.skillLevel - b.skillLevel;
    }).slice(0, 15);

    return {
      rawScore: Object.values(sdsResult.totalScores).reduce((a, b) => a + b, 0),
      calculatedData: {
        ...sdsResult,
        recommendedOccupations
      },
      classification: sdsResult.summaryCode
    };
  }

  buildAiPrompt(calculatedData: any, clientData: any): string {
    return `
Anda adalah seorang Ahli Konseling Karir dan Psikolog Pendidikan.
Tugas Anda adalah memberikan analisis minat bakat berdasarkan tes Holland (RIASEC / SDS) untuk remaja.

DATA KLIEN:
- Nama: ${clientData?.name || 'Klien'}
- Kode Holland Dominan (Summary Code): ${calculatedData.summaryCode}
- Tiga Kode Teratas: ${calculatedData.dominantCodes.join(', ')}
- Peringatan (Jika ada): ${calculatedData.warnings.join(' | ')}
- Narasi SDS Bawaan: ${calculatedData.interpretation.personalityNarrative}
- Rekomendasi Karir Bawaan: ${calculatedData.interpretation.careerSuggestions.slice(0,5).join(', ')}

INSTRUKSI:
Berdasarkan data di atas, berikan:
1. Penjelasan komprehensif tentang profil karir anak ini dengan bahasa yang sangat memotivasi.
2. 3 Rekomendasi Fakultas/Jurusan kuliah (buat lebih spesifik sesuai tren masa kini).
3. 3 Contoh Profesi (bisa ambil dari bawaan SDS atau tambahkan yang modern).
4. Pesan pengembangan diri.

KEMBALIKAN OUTPUT HARUS DALAM FORMAT JSON BERIKUT (tanpa markdown blok tambahan):
{
  "summary": "Penjelasan profil",
  "recommended_majors": ["Jurusan 1", "Jurusan 2", "Jurusan 3"],
  "recommended_professions": ["Profesi 1", "Profesi 2", "Profesi 3"],
  "development_tips": ["Tips 1", "Tips 2", "Tips 3"]
}
`;
  }
}
