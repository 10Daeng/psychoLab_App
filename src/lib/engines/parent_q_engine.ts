import { BaseTestEngine, AssessmentResult } from './base_engine';

export class ParentQEngine extends BaseTestEngine {
  constructor() {
    super('PARENT_Q');
  }

  async calculateScores(answers: any, clientData?: any): Promise<AssessmentResult> {
    let historyData = {};
    let abicData = {};

    if (Array.isArray(answers)) {
      const historyLog = answers.find((a: any) => a.type === 'HISTORY');
      if (historyLog && historyLog.responses) {
        historyData = historyLog.responses;
      }
      const abicLog = answers.find((a: any) => a.type === 'ABIC');
      if (abicLog && abicLog.responses) {
        abicData = abicLog.responses;
      }
    } else {
      historyData = answers || {};
    }

    // Hitung kemandirian (independent) dari data ABIC
    const values = Object.values(abicData);
    const independent = values.length > 0 && values.filter(Boolean).length >= Math.floor(values.length / 2);

    return {
      rawScore: 0,
      classification: "Observasi Selesai",
      calculatedData: {
        history: historyData,
        independent: independent
      }
    };
  }

  buildAiPrompt(calculatedData: any, clientData: any, parentData?: any): string {
    const history = calculatedData.history;
    const name = clientData?.name || "Anak";

    return `Anda adalah psikolog klinis anak yang sedang membaca laporan kuesioner observasi dari orang tua tentang ${name}.

DATA KUESIONER ORANG TUA:
- Riwayat Kehamilan/Kelahiran: ${history.kehamilan || '-'}
- Motorik: ${history.motorikKasar || '-'} (Kasar/Halus: ${history.motorikHalus || '-'})
- Bahasa: ${history.bahasa || '-'}
- Sosial: ${history.sosial || '-'}
- Emosi: ${history.emosi || '-'}
- Catatan Tambahan: ${history.catatan || '-'}

INSTRUKSI PENULISAN:
Buatlah ringkasan komprehensif mengenai profil perkembangan anak ini berdasarkan laporan orang tuanya.
Fokus pada:
1. Konteks riwayat tumbuh kembang yang relevan dengan kesiapannya di sekolah.
2. Analisis singkat dari sudut pandang psikologis (adakah potensi red flags atau ini perkembangan normal?).
Gunakan bahasa profesional yang empatik, tidak menghakimi. JANGAN BERIKAN DIAGNOSIS medis, cukup evaluasi kecenderungan perilaku.
`;
  }
}
