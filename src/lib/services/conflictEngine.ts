// src/lib/services/conflictEngine.ts

// ============================================================================
// 1. DEFINISI TIPE DATA (TYPE DEFINITIONS)
// ============================================================================

export type ReportContext = 'CHILD' | 'STUDENT' | 'EMPLOYEE';

export interface ConflictFlag {
  dimension: string;
  sourceA_Label: string;
  sourceA_Value: string | number;
  sourceB_Label: string;
  sourceB_Value: string | number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
}

// Data spesifik per instrumen
interface CognitiveData { ravenScore?: number; cpmScore?: number; datScores?: { verbal: number; numerical: number } }
interface PersonalityData { E: number; X: number; A: number; C: number; O: number; H: number } // HEXACO
interface DiscData { D: number; I: number; S: number; C: number }
interface SdsData { topHollandCodes: string[] } // misal: ['Investigative', 'Social']
interface WviData { topValues: string[] }
interface ProjectiveData { slant?: string; baseline?: string; tBar?: string; warteggAnomalies?: string[] }
interface ClinicalObservation { showsSeparationAnxiety?: boolean; emotionalRegulation?: 'POOR' | 'FAIR' | 'GOOD' }
interface ParentQuestionnaire { claimsIndependent?: boolean; reportsNoStress?: boolean }

export interface AssessmentPayload {
  cognitive?: CognitiveData;
  hexaco?: PersonalityData;
  disc?: DiscData;
  sds?: SdsData;
  wvi?: WviData;
  projective?: ProjectiveData;
  observation?: ClinicalObservation;
  parentForm?: ParentQuestionnaire;
}

// ============================================================================
// 2. FUNGSI UTAMA (MAIN ENGINE)
// ============================================================================

export function evaluateConflicts(
  context: ReportContext,
  data: AssessmentPayload
): ConflictFlag[] {
  switch (context) {
    case 'CHILD':
      return evaluateChild(data);
    case 'STUDENT':
      return evaluateStudent(data);
    case 'EMPLOYEE':
      return evaluateEmployee(data);
    default:
      return [];
  }
}

// ============================================================================
// 3. LOGIKA MATRIKS: ANAK (Tumbuh Kembang & Asinkronitas)
// ============================================================================
function evaluateChild(data: AssessmentPayload): ConflictFlag[] {
  const flags: ConflictFlag[] = [];
  const { cognitive, observation, parentForm } = data;

  if (parentForm && observation) {
    // Konflik 1: Ekspektasi Ortu vs Realitas Emosi Anak
    if (parentForm.claimsIndependent && observation.showsSeparationAnxiety) {
      flags.push({
        dimension: "Kemandirian vs Kecemasan",
        sourceA_Label: "Klaim Orang Tua (Kuesioner)",
        sourceA_Value: "Sangat Mandiri",
        sourceB_Label: "Observasi Klinis",
        sourceB_Value: "Kecemasan Perpisahan (Separation Anxiety)",
        severity: "HIGH",
        message: "Asinkronitas persepsi pengasuhan: Anak menekan emosinya di rumah demi memenuhi ekspektasi, namun menunjukkan stres di lingkungan baru."
      });
    }

    // Konflik 2: Aql (Kognitif) vs Regulasi Emosi
    if (cognitive?.cpmScore && cognitive.cpmScore >= 120 && observation.emotionalRegulation === 'POOR') {
      flags.push({
        dimension: "Kognitif vs Regulasi Emosi",
        sourceA_Label: "Kapasitas Kognitif (CPM)",
        sourceA_Value: `Superior (Skor: ${cognitive.cpmScore})`,
        sourceB_Label: "Observasi Klinis",
        sourceB_Value: "Tantrum / Regulasi Emosi Rendah",
        severity: "HIGH",
        message: "Asinkronitas Perkembangan: Kapasitas nalar (Aql) anak berkembang melampaui kemampuan regulasi emosinya, rentan memicu rasa frustrasi karena keinginannya tidak selalu sejalan dengan realitas fisik/sosialnya."
      });
    }
  }

  return flags;
}

// ============================================================================
// 4. LOGIKA MATRIKS: REMAJA (Penjurusan & Realisme Karir)
// ============================================================================
function evaluateStudent(data: AssessmentPayload): ConflictFlag[] {
  const flags: ConflictFlag[] = [];
  const { cognitive, sds, hexaco } = data;

  if (sds) {
    const isSains = sds.topHollandCodes.includes('Investigative') || sds.topHollandCodes.includes('Realistic');
    const isSosial = sds.topHollandCodes.includes('Social') || sds.topHollandCodes.includes('Enterprising');

    // 1. Validasi Kognitif (Raven 2) Sebagai Gatekeeper IPA
    if (isSains && cognitive?.ravenScore && cognitive.ravenScore < 95) {
      flags.push({
        dimension: "Aspirasi Akademik vs Kesiapan Kognitif",
        sourceA_Label: "Minat Karir (SDS)",
        sourceA_Value: "Investigative / Realistic (Kutub Sains)",
        sourceB_Label: "Kapasitas Nalar (Raven 2)",
        sourceB_Value: `Kurang Optimal (Skor: ${cognitive.ravenScore})`,
        severity: "HIGH",
        message: "Klien memiliki minat yang kuat pada sains/analisis, namun kapasitas penalaran abstraknya (fluid intelligence) saat ini belum optimal untuk menopang ritme akademik IPA yang berat. Ada risiko frustrasi belajar. Disarankan untuk mematangkan minat di rumpun IPS yang lebih aplikatif, atau masuk IPA dengan dukungan bimbingan akademik yang intensif."
      });
    }

    // 2. Validasi Karakter (HEXACO) Sebagai Detektor Burnout IPS
    if (isSosial && hexaco && hexaco.E < 40) {
      flags.push({
        dimension: "Minat Sosial vs Karakter Dasar",
        sourceA_Label: "Minat Karir (SDS)",
        sourceA_Value: "Social / Enterprising (Kutub IPS)",
        sourceB_Label: "Temperamen (HEXACO - Extraversion)",
        sourceB_Value: `Introvert (Skor: ${hexaco.E})`,
        severity: "MEDIUM",
        message: "Minat sosial yang tinggi mungkin merupakan idealisme atau ekspektasi lingkungan. Secara temperamen, klien sangat introvert dan rentan mengalami social burnout jika dipaksakan masuk ke rumpun yang menuntut interaksi manusia terus-menerus."
      });
    }

    // 3. Validasi Karakter (HEXACO) Sebagai Underachiever Risk IPA
    if (isSains && cognitive?.ravenScore && cognitive.ravenScore >= 95 && hexaco && hexaco.C < 40) {
      flags.push({
        dimension: "Kapasitas Kognitif vs Ketekunan",
        sourceA_Label: "Minat & Kognitif (SDS & Raven2)",
        sourceA_Value: `Kapasitas Kuat (Raven: ${cognitive.ravenScore})`,
        sourceB_Label: "Temperamen (HEXACO - Conscientiousness)",
        sourceB_Value: `Impulsif/Kurang Tekun (Skor: ${hexaco.C})`,
        severity: "HIGH",
        message: "Secara kognitif klien sangat mampu (Aql kuat), namun memiliki tantangan besar dalam ketekunan dan struktur (Conscientiousness rendah). Di jurusan IPA, klien berisiko menjadi underachiever karena bosan dengan rutinitas laboratorium atau perhitungan rumus yang kaku."
      });
    }
  }

  return flags;
}

// ============================================================================
// 5. LOGIKA MATRIKS: KARYAWAN (Rekrutmen & Culture Fit)
// ============================================================================
function evaluateEmployee(data: AssessmentPayload): ConflictFlag[] {
  const flags: ConflictFlag[] = [];
  const { disc, hexaco, wvi, projective } = data;

  // 1. Uji Kepemimpinan Palsu (DISC Dominance vs Proyektif)
  if (disc?.D && disc.D > 75 && projective?.tBar === 'LOW') {
    flags.push({
      dimension: "Asertivitas vs Kepercayaan Diri Internal",
      sourceA_Label: "Gaya Kerja (DISC - Dominance)",
      sourceA_Value: `Sangat Dominan (Skor: ${disc.D})`,
      sourceB_Label: "Proyeksi Bawah Sadar (Grafologi)",
      sourceB_Value: "Palang T Rendah (Self-esteem rentan)",
      severity: "HIGH",
      message: "Risiko Kepemimpinan Otoriter: Gaya tegas di permukaan kemungkinan adalah kompensasi dari keraguan diri internal. Di bawah tekanan, kandidat berisiko bersikap defensif atau menekan bawahan alih-alih merangkul tim."
    });
  }

  // 2. Uji 'Faking Good' Kepatuhan (HEXACO C vs Proyektif)
  if (hexaco?.C && hexaco.C > 80 && projective?.baseline === 'ERRATIC') {
    flags.push({
      dimension: "Klaim Keteraturan vs Stabilitas Emosi",
      sourceA_Label: "Ketelitian & Disiplin (HEXACO - C)",
      sourceA_Value: `Sangat Patuh (Skor: ${hexaco.C})`,
      sourceB_Label: "Proyeksi Bawah Sadar (Grafologi)",
      sourceB_Value: "Baseline Fluktuatif (Emosi tidak stabil / Impulsif)",
      severity: "HIGH",
      message: "Indikasi Faking Good: Kandidat memahami apa yang diharapkan perusahaan (kepatuhan), namun dorongan batin aslinya cukup impulsif. Rentan melakukan jalan pintas (shortcut) terhadap SOP saat pengawasan minim."
    });
  }

  // 3. Uji Kecocokan Budaya (WVI vs DISC)
  if (wvi?.topValues.includes('Kemandirian') && disc && (disc.C > 75 || disc.S > 75)) {
    flags.push({
      dimension: "Ekspektasi Otonomi vs Kebutuhan Struktur",
      sourceA_Label: "Nilai Kerja Utama (WVI)",
      sourceA_Value: "Mendambakan Kemandirian",
      sourceB_Label: "Gaya Eksekusi (DISC - C/S)",
      sourceB_Value: "Kepatuhan/Stabilitas Sangat Tinggi",
      severity: "MEDIUM",
      message: "Konflik Internal Motivasi: Kandidat menginginkan kebebasan bekerja, namun secara temperamen sangat cemas bila bekerja tanpa arahan dan SOP yang rigid. Ia butuh pendelegasian yang bertahap, bukan kebebasan mutlak."
    });
  }

  // 4. Deteksi Kelelahan Kerja / Burnout (Jika HEXACO Extraversion tinggi tapi Grafologi menarik diri)
  if (hexaco?.E && hexaco.E > 75 && projective?.slant === 'A') {
    flags.push({
      dimension: "Tuntutan Sosial vs Kapasitas Energi Batin",
      sourceA_Label: "Sosiabilitas (HEXACO - E)",
      sourceA_Value: `Sangat Ekstrovert (Skor: ${hexaco.E})`,
      sourceB_Label: "Proyeksi Bawah Sadar (Grafologi)",
      sourceB_Value: "Slant Kiri Ekstrem (Menarik diri secara emosional)",
      severity: "HIGH",
      message: "Risiko Social Burnout: Kandidat menampilkan persona yang sangat ramah dan terbuka (kemungkinan karena tuntutan peran masa lalu), namun batinnya sangat menjaga jarak aman. Jika ditempatkan di posisi frontliner intens, ia rentan mengalami kelelahan mental."
    });
  }

  return flags;
}
