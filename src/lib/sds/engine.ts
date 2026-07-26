import {
  RIASEC_CODES,
  SDS_SECTIONS,
  type RankedRiasec,
  type RiasecScoreMap,
  type SdsAnswerMap,
  type SdsAnswerValue,
  type SdsCompleteness,
  type SdsEngineConfig,
  type SdsItem,
  type SdsResult,
  type SdsSectionCompleteness,
  type SdsSectionScores,
} from "./types";

import {
  DEFAULT_SDS_ENGINE_CONFIG,
  SDS_ENGINE_VERSION,
} from "./constants";

import { SDS_ITEMS } from "./data-loader";
import { buildSdsInterpretation } from "./interpretation";
import { resolveSummaryCodes } from "./ranking";
import { evaluateSdsValidity } from "./validity";

export function scoreSds(params: {
  answers: SdsAnswerMap;
  items?: SdsItem[];
  config?: Partial<SdsEngineConfig>;
}): SdsResult {
  const items = params.items ?? SDS_ITEMS;
  const config = {
    ...DEFAULT_SDS_ENGINE_CONFIG,
    ...params.config,
  };

  const warnings: string[] = [];
  const sectionScores = createEmptySectionScores();
  const totalScores = createEmptyRiasecScores();

  for (const item of items) {
    const rawValue = params.answers[item.id];
    const score = scoreItem(item, rawValue);

    sectionScores[item.section][item.code] += score;
    totalScores[item.code] += score;
  }

  const rankedCodes = rankRiasecCodes(totalScores);
  const codeResolution = resolveSummaryCodes(totalScores);
  const summaryCode = codeResolution.primarySummaryCode;
  const dominantCodes = summaryCode.split("") as typeof rankedCodes[number]["code"][];

  const sectionCompleteness = calculateSectionCompleteness(params.answers, items);
  const overallCompleteness = calculateOverallCompleteness(sectionCompleteness);

  const validity = evaluateSdsValidity({
    answers: params.answers,
    items,
    totalScores,
    rankedCodes,
    sectionScores,
    overallCompleteness,
    codeResolution,
    config: {
      minimumCompletenessPercentage: config.minimumCompletenessPercentage,
      lowDifferentiationGapThreshold: config.lowDifferentiationGapThreshold,
    },
  });

  warnings.push(
    ...buildWarnings({
      rankedCodes,
      overallCompleteness,
      config,
    })
  );

  if (codeResolution.note) {
    warnings.push(codeResolution.note);
  }

  warnings.push(...validity.flags.map((flag) => flag.message));

  const interpretation = buildSdsInterpretation({
    summaryCode,
    dominantCodes,
    rankedCodes,
    warnings,
  });

  return {
    engineVersion: SDS_ENGINE_VERSION,
    sectionScores,
    totalScores,
    rankedCodes,
    summaryCode,
    codeResolution,
    dominantCodes,
    sectionCompleteness,
    overallCompleteness,
    validity,
    interpretation,
    warnings: Array.from(new Set(warnings)),
  };
}

export function scoreItem(item: SdsItem, rawValue: SdsAnswerValue): number {
  if (item.scoringType === "binary") {
    return rawValue === true ? 1 : 0;
  }

  if (item.scoringType === "rating") {
    if (rawValue === null || rawValue === undefined || rawValue === false) {
      return 0;
    }

    if (typeof rawValue !== "number" || Number.isNaN(rawValue)) {
      throw new Error(`Jawaban item ${item.id} harus berupa angka.`);
    }

    const min = item.minValue ?? 1;
    const max = item.maxValue ?? 10;

    if (rawValue < min || rawValue > max) {
      throw new Error(
        `Jawaban item ${item.id} harus berada antara ${min} dan ${max}.`
      );
    }

    return rawValue;
  }

  return 0;
}

export function createEmptyRiasecScores(): RiasecScoreMap {
  return {
    R: 0,
    I: 0,
    A: 0,
    S: 0,
    E: 0,
    C: 0,
  };
}

export function createEmptySectionScores(): SdsSectionScores {
  return {
    activities: createEmptyRiasecScores(),
    competencies: createEmptyRiasecScores(),
    occupations: createEmptyRiasecScores(),
    selfEstimates: createEmptyRiasecScores(),
  };
}

export function rankRiasecCodes(totalScores: RiasecScoreMap): RankedRiasec[] {
  const sorted = RIASEC_CODES.map((code) => ({
    code,
    score: totalScores[code],
  })).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;

    // Tie-breaker deterministik agar hasil konsisten.
    // Warning skor seri tetap dibuat di buildWarnings().
    return RIASEC_CODES.indexOf(a.code) - RIASEC_CODES.indexOf(b.code);
  });

  let currentRank = 1;

  return sorted.map((item, index) => {
    if (index > 0 && item.score < sorted[index - 1].score) {
      currentRank = index + 1;
    }

    return {
      ...item,
      rank: currentRank,
    };
  });
}

export function calculateSectionCompleteness(
  answers: SdsAnswerMap,
  items: SdsItem[]
): SdsSectionCompleteness {
  const result = {} as SdsSectionCompleteness;

  for (const section of SDS_SECTIONS) {
    const sectionItems = items.filter((item) => item.section === section);

    const answeredItems = sectionItems.filter((item) => {
      // Dalam format SDS, item binary yang tidak dicentang adalah jawaban valid:
      // artinya tidak disukai/tidak dipilih. Karena itu binary dianggap terisi.
      if (item.scoringType === "binary") return true;

      return isAnswered(answers[item.id], item);
    }).length;

    result[section] = buildCompleteness(sectionItems.length, answeredItems);
  }

  return result;
}

export function calculateOverallCompleteness(
  sectionCompleteness: SdsSectionCompleteness
): SdsCompleteness {
  const expectedItems = SDS_SECTIONS.reduce(
    (sum, section) => sum + sectionCompleteness[section].expectedItems,
    0
  );

  const answeredItems = SDS_SECTIONS.reduce(
    (sum, section) => sum + sectionCompleteness[section].answeredItems,
    0
  );

  return buildCompleteness(expectedItems, answeredItems);
}

function buildCompleteness(
  expectedItems: number,
  answeredItems: number
): SdsCompleteness {
  const percentage =
    expectedItems === 0 ? 0 : Math.round((answeredItems / expectedItems) * 100);

  return {
    expectedItems,
    answeredItems,
    percentage,
  };
}

function isAnswered(value: SdsAnswerValue, item: SdsItem): boolean {
  if (item.scoringType === "binary") {
    return true;
  }

  return typeof value === "number" && Number.isFinite(value);
}

function buildWarnings(params: {
  rankedCodes: RankedRiasec[];
  overallCompleteness: SdsCompleteness;
  config: SdsEngineConfig;
}): string[] {
  const warnings: string[] = [];
  const { rankedCodes, overallCompleteness, config } = params;

  if (overallCompleteness.percentage < config.minimumCompletenessPercentage) {
    warnings.push(
      `Kelengkapan jawaban baru ${overallCompleteness.percentage}%. Hasil belum ideal untuk dijadikan dasar konseling.`
    );
  }

  const top = rankedCodes[0];
  const second = rankedCodes[1];
  const third = rankedCodes[2];

  if (top && third) {
    const gap = top.score - third.score;

    if (gap <= config.lowDifferentiationGapThreshold) {
      warnings.push(
        "Diferensiasi skor rendah: tiga kode teratas berdekatan. Perlu wawancara lanjutan sebelum menyimpulkan arah jurusan."
      );
    }
  }

  if (top) {
    const tiedTop = rankedCodes.filter((item) => item.score === top.score);

    if (tiedTop.length > 1) {
      warnings.push(
        `Ada skor tertinggi yang seri pada kode ${tiedTop
          .map((item) => item.code)
          .join(", ")}. Interpretasi perlu hati-hati.`
      );
    }
  }

  if (top && second && top.score === 0 && second.score === 0) {
    warnings.push(
      "Tidak ada skor bermakna. Periksa apakah siswa benar-benar mengisi instrumen."
    );
  }

  return warnings;
}
