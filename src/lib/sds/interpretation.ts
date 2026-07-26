import { SDS_MAJOR_MAP } from "./data-loader";

import type {
  RankedRiasec,
  RiasecCode,
  SdsInterpretation,
} from "./types";

export function buildSdsInterpretation(params: {
  summaryCode: string;
  dominantCodes: RiasecCode[];
  rankedCodes: RankedRiasec[];
  warnings: string[];
}): SdsInterpretation {
  const { summaryCode, dominantCodes, rankedCodes, warnings } = params;

  const codeDescriptions = dominantCodes.map((code) => ({
    code,
    label: SDS_MAJOR_MAP.labels[code],
    description: SDS_MAJOR_MAP.descriptions[code],
  }));

  const suggestedMajorClusters = buildMajorSuggestions(dominantCodes);

  const headline =
    summaryCode.length > 0
      ? `Profil minat utama siswa mengarah pada kode ${summaryCode}.`
      : "Profil minat belum dapat dibaca.";

  const profileSummary = buildProfileSummary({
    dominantCodes,
    rankedCodes,
  });

  const counselingNotes = [
    "Gunakan hasil ini sebagai peta eksplorasi, bukan keputusan final.",
    "Cocokkan hasil SDS dengan nilai rapor, mata pelajaran kuat, daya tahan belajar, peluang masuk, biaya, dan dukungan keluarga.",
    "Jika skor antar kode berdekatan, lakukan wawancara konseling untuk melihat minat yang benar-benar stabil.",
    "Hasil SDS sebaiknya dipadukan dengan data akademik dan rencana hidup siswa, bukan berdiri sendiri.",
    ...warnings,
  ];

  return {
    headline,
    profileSummary,
    codeDescriptions,
    suggestedMajorClusters,
    counselingNotes: unique(counselingNotes),
  };
}

function buildMajorSuggestions(codes: RiasecCode[]): string[] {
  const [first, second, third] = codes;
  const suggestions: string[] = [];

  if (first && second) {
    const comboA = `${first}${second}`;
    const comboB = `${second}${first}`;

    suggestions.push(...(SDS_MAJOR_MAP.clustersByCombo[comboA] ?? []));
    suggestions.push(...(SDS_MAJOR_MAP.clustersByCombo[comboB] ?? []));
  }

  if (first && third) {
    const comboA = `${first}${third}`;
    const comboB = `${third}${first}`;

    suggestions.push(...(SDS_MAJOR_MAP.clustersByCombo[comboA] ?? []));
    suggestions.push(...(SDS_MAJOR_MAP.clustersByCombo[comboB] ?? []));
  }

  for (const code of codes) {
    suggestions.push(...SDS_MAJOR_MAP.clustersByCode[code]);
  }

  return unique(suggestions).slice(0, 24);
}

function buildProfileSummary(params: {
  dominantCodes: RiasecCode[];
  rankedCodes: RankedRiasec[];
}): string {
  const { dominantCodes, rankedCodes } = params;
  const labels = dominantCodes.map((code) => SDS_MAJOR_MAP.labels[code]);

  if (dominantCodes.length === 0) {
    return "Jawaban belum cukup untuk membuat ringkasan profil.";
  }

  if (dominantCodes.length === 1) {
    const code = dominantCodes[0];
    return `Kecenderungan utama siswa berada pada ${SDS_MAJOR_MAP.labels[code]}. ${SDS_MAJOR_MAP.descriptions[code]}`;
  }

  const scoreText = rankedCodes
    .slice(0, 3)
    .map((item) => `${item.code}: ${item.score}`)
    .join(", ");

  return `Kecenderungan utama siswa berada pada kombinasi ${labels.join(
    " - "
  )}. Skor teratas: ${scoreText}. Interpretasi jurusan sebaiknya membaca kombinasi kode ini, bukan hanya kode pertama.`;
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}
