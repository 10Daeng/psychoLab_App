import { RIASEC_CODES, SDS_SECTIONS } from "./types";
import type {
  RankedRiasec,
  RiasecCode,
  RiasecScoreMap,
  SdsAnswerMap,
  SdsCodeResolution,
  SdsCompleteness,
  SdsItem,
  SdsSectionScores,
  SdsValidityFlag,
  SdsValidityReport,
  SdsValidityStatus,
} from "./types";

export type ValidityConfig = {
  minimumCompletenessPercentage: number;
  lowDifferentiationGapThreshold: number;
  flatProfileRangeThreshold: number;
  tooFewBinarySelectionPercentage: number;
  tooManyBinarySelectionPercentage: number;
  selfEstimateHighAverageThreshold: number;
  selfEstimateLowAverageThreshold: number;
  selfEstimateLowVarianceThreshold: number;
  minimumSectionAgreementRatio: number;
};

export const DEFAULT_VALIDITY_CONFIG: ValidityConfig = {
  minimumCompletenessPercentage: 80,
  lowDifferentiationGapThreshold: 3,
  flatProfileRangeThreshold: 6,
  tooFewBinarySelectionPercentage: 8,
  tooManyBinarySelectionPercentage: 85,
  selfEstimateHighAverageThreshold: 8.8,
  selfEstimateLowAverageThreshold: 2.2,
  selfEstimateLowVarianceThreshold: 1.2,
  minimumSectionAgreementRatio: 0.5,
};

/**
 * Laporan ini lebih tepat disebut "kelayakan interpretasi" atau
 * response validity check, bukan validitas psikometrik penuh.
 *
 * Validitas psikometrik penuh butuh studi norma, reliabilitas, validitas
 * konstruk/kriteria, dan sampel empirik. Engine ini hanya mendeteksi pola
 * jawaban yang membuat hasil perlu dibaca hati-hati.
 */
export function evaluateSdsValidity(params: {
  answers: SdsAnswerMap;
  items: SdsItem[];
  totalScores: RiasecScoreMap;
  rankedCodes: RankedRiasec[];
  sectionScores: SdsSectionScores;
  overallCompleteness: SdsCompleteness;
  codeResolution: SdsCodeResolution;
  config?: Partial<ValidityConfig>;
}): SdsValidityReport {
  const config = {
    ...DEFAULT_VALIDITY_CONFIG,
    ...params.config,
  };

  const flags: SdsValidityFlag[] = [];

  flags.push(
    ...checkCompleteness(params.overallCompleteness, config),
    ...checkTieCodes(params.codeResolution),
    ...checkDifferentiation(params.rankedCodes, config),
    ...checkFlatProfile(params.totalScores, config),
    ...checkBinarySelectionRate(params.answers, params.items, config),
    ...checkSelfEstimatePattern(params.answers, params.items, config),
    ...checkSectionConsistency(params.sectionScores, config)
  );

  const status = calculateValidityStatus(flags);
  const score = calculateValidityScore(flags);
  const label = buildValidityLabel(status);
  const summary = buildValiditySummary(status, flags);

  return {
    status,
    score,
    label,
    flags,
    summary,
  };
}

function checkCompleteness(
  completeness: SdsCompleteness,
  config: ValidityConfig
): SdsValidityFlag[] {
  if (completeness.percentage >= config.minimumCompletenessPercentage) {
    return [];
  }

  return [
    {
      code: "LOW_COMPLETENESS",
      severity: completeness.percentage < 60 ? "critical" : "warning",
      message: `Kelengkapan jawaban ${completeness.percentage}%. Hasil belum cukup kuat untuk dibaca sebagai dasar keputusan.`,
      evidence: completeness,
    },
  ];
}

function checkTieCodes(
  codeResolution: SdsCodeResolution
): SdsValidityFlag[] {
  if (!codeResolution.ambiguous) return [];

  return [
    {
      code: "TIED_DOMINANT_CODES",
      severity: "warning",
      message:
        "Ada skor yang sama pada kode dominan. Hasil perlu dibaca sebagai beberapa kemungkinan kode, bukan satu kode tunggal.",
      evidence: {
        primarySummaryCode: codeResolution.primarySummaryCode,
        alternativeSummaryCodes: codeResolution.alternativeSummaryCodes,
        tieGroups: codeResolution.tieGroups,
      },
    },
  ];
}

function checkDifferentiation(
  rankedCodes: RankedRiasec[],
  config: ValidityConfig
): SdsValidityFlag[] {
  const top = rankedCodes[0];
  const third = rankedCodes[2];

  if (!top || !third) return [];

  const gap = top.score - third.score;

  if (gap > config.lowDifferentiationGapThreshold) return [];

  return [
    {
      code: "LOW_DIFFERENTIATION",
      severity: "warning",
      message:
        "Diferensiasi skor rendah. Tiga kode teratas terlalu berdekatan, sehingga profil minat belum tajam.",
      evidence: {
        topScore: top.score,
        thirdScore: third.score,
        gap,
        rankedCodes: rankedCodes.slice(0, 3),
      },
    },
  ];
}

function checkFlatProfile(
  totalScores: RiasecScoreMap,
  config: ValidityConfig
): SdsValidityFlag[] {
  const scores = RIASEC_CODES.map((code) => totalScores[code]);
  const range = Math.max(...scores) - Math.min(...scores);

  if (range > config.flatProfileRangeThreshold) return [];

  return [
    {
      code: "FLAT_PROFILE",
      severity: "warning",
      message:
        "Profil skor terlalu datar. Ini bisa berarti minat siswa masih sangat luas, belum terdiferensiasi, atau siswa menjawab terlalu umum.",
      evidence: {
        range,
        totalScores,
      },
    },
  ];
}

function checkBinarySelectionRate(
  answers: SdsAnswerMap,
  items: SdsItem[],
  config: ValidityConfig
): SdsValidityFlag[] {
  const binaryItems = items.filter((item) => item.scoringType === "binary");

  if (binaryItems.length === 0) return [];

  const selectedCount = binaryItems.filter((item) => answers[item.id] === true)
    .length;

  const percentage = Math.round((selectedCount / binaryItems.length) * 100);

  if (percentage < config.tooFewBinarySelectionPercentage) {
    return [
      {
        code: "TOO_FEW_SELECTIONS",
        severity: "warning",
        message:
          "Jumlah pilihan terlalu sedikit. Ada kemungkinan siswa terlalu ragu, kurang memahami instruksi, atau menjawab terlalu defensif.",
        evidence: {
          selectedCount,
          totalBinaryItems: binaryItems.length,
          percentage,
        },
      },
    ];
  }

  if (percentage > config.tooManyBinarySelectionPercentage) {
    return [
      {
        code: "TOO_MANY_SELECTIONS",
        severity: "warning",
        message:
          "Jumlah pilihan terlalu banyak. Ada kemungkinan siswa memilih hampir semua hal sehingga profil menjadi kurang tajam.",
        evidence: {
          selectedCount,
          totalBinaryItems: binaryItems.length,
          percentage,
        },
      },
    ];
  }

  return [];
}

function checkSelfEstimatePattern(
  answers: SdsAnswerMap,
  items: SdsItem[],
  config: ValidityConfig
): SdsValidityFlag[] {
  const ratingItems = items.filter((item) => item.scoringType === "rating");
  const values = ratingItems
    .map((item) => answers[item.id])
    .filter((value): value is number => typeof value === "number");

  if (values.length === 0) return [];

  const average = mean(values);
  const sd = standardDeviation(values);
  const flags: SdsValidityFlag[] = [];

  if (average >= config.selfEstimateHighAverageThreshold) {
    flags.push({
      code: "SELF_ESTIMATE_OVERCLAIM",
      severity: "info",
      message:
        "Rata-rata penilaian diri sangat tinggi. Perlu cek apakah siswa benar-benar memiliki bukti kompetensi atau hanya merasa mampu.",
      evidence: {
        average,
        values,
      },
    });
  }

  if (average <= config.selfEstimateLowAverageThreshold) {
    flags.push({
      code: "SELF_ESTIMATE_UNDERCLAIM",
      severity: "info",
      message:
        "Rata-rata penilaian diri sangat rendah. Perlu cek faktor kepercayaan diri, kecemasan, atau pemahaman siswa terhadap skala.",
      evidence: {
        average,
        values,
      },
    });
  }

  if (sd <= config.selfEstimateLowVarianceThreshold) {
    flags.push({
      code: "SELF_ESTIMATE_LOW_VARIANCE",
      severity: "warning",
      message:
        "Variasi penilaian diri sangat rendah. Siswa memberi nilai hampir sama pada banyak kemampuan, sehingga pembeda profil menjadi lemah.",
      evidence: {
        standardDeviation: sd,
        values,
      },
    });
  }

  return flags;
}

function checkSectionConsistency(
  sectionScores: SdsSectionScores,
  config: ValidityConfig
): SdsValidityFlag[] {
  const dominantBySection = SDS_SECTIONS.map((section) => {
    const scores = sectionScores[section];
    const dominant = [...RIASEC_CODES].sort((a, b) => scores[b] - scores[a])[0];

    return {
      section,
      dominant,
      score: scores[dominant],
    };
  });

  const dominantCounts = new Map<RiasecCode, number>();

  for (const item of dominantBySection) {
    dominantCounts.set(item.dominant, (dominantCounts.get(item.dominant) ?? 0) + 1);
  }

  const highestAgreement = Math.max(...Array.from(dominantCounts.values()));
  const agreementRatio = highestAgreement / SDS_SECTIONS.length;

  if (agreementRatio >= config.minimumSectionAgreementRatio) return [];

  return [
    {
      code: "LOW_SECTION_CONSISTENCY",
      severity: "warning",
      message:
        "Dominasi kode antar aspek kurang konsisten. Minat, kompetensi, pekerjaan, dan penilaian diri belum menunjuk arah yang sama.",
      evidence: {
        dominantBySection,
        agreementRatio,
      },
    },
  ];
}

function calculateValidityStatus(
  flags: SdsValidityFlag[]
): SdsValidityStatus {
  const criticalCount = flags.filter((flag) => flag.severity === "critical")
    .length;

  const warningCount = flags.filter((flag) => flag.severity === "warning")
    .length;

  if (criticalCount >= 1) return "not_interpretable";
  if (warningCount >= 3) return "needs_counselor_review";
  if (warningCount >= 1) return "interpretable_with_caution";

  return "interpretable";
}

function calculateValidityScore(flags: SdsValidityFlag[]): number {
  const penalty = flags.reduce((sum, flag) => {
    if (flag.severity === "critical") return sum + 35;
    if (flag.severity === "warning") return sum + 15;
    return sum + 5;
  }, 0);

  return Math.max(0, Math.min(100, 100 - penalty));
}

function buildValidityLabel(status: SdsValidityStatus): string {
  switch (status) {
    case "interpretable":
      return "Layak diinterpretasi";
    case "interpretable_with_caution":
      return "Layak diinterpretasi dengan kehati-hatian";
    case "needs_counselor_review":
      return "Perlu review konselor";
    case "not_interpretable":
      return "Belum layak diinterpretasi";
  }
}

function buildValiditySummary(
  status: SdsValidityStatus,
  flags: SdsValidityFlag[]
): string {
  if (status === "interpretable") {
    return "Pola jawaban cukup layak dibaca sebagai dasar eksplorasi jurusan dan pekerjaan.";
  }

  const messages = flags
    .filter((flag) => flag.severity !== "info")
    .map((flag) => flag.message);

  return messages.length > 0
    ? messages.join(" ")
    : "Ada catatan kecil pada pola jawaban. Interpretasi tetap perlu dikombinasikan dengan wawancara.";
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  const average = mean(values);
  const variance =
    values.reduce((sum, value) => sum + Math.pow(value - average, 2), 0) /
    values.length;

  return Math.sqrt(variance);
}
