import { BaseTestEngine, AssessmentResult } from './base_engine';

export class ParentQEngine extends BaseTestEngine {
  constructor() {
    super('PARENT_Q');
  }

  async calculateScores(answers: any, clientData?: any): Promise<AssessmentResult> {
    // answers dari custom form
    const historyData = answers || {};

    return {
      rawScore: 0,
      classification: "Observasi Selesai",
      calculatedData: {
        history: historyData
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
