export const RIASEC_CODES = ["R", "I", "A", "S", "E", "C"] as const;

export type RiasecCode = (typeof RIASEC_CODES)[number];

export const SDS_SECTIONS = [
  "activities",
  "competencies",
  "occupations",
  "selfEstimates",
] as const;

export type SdsSection = (typeof SDS_SECTIONS)[number];

export type SdsScoringType = "binary" | "rating";

export type SdsItem = {
  id: string;
  section: SdsSection;
  code: RiasecCode;
  text: string;
  scoringType: SdsScoringType;
  minValue?: number;
  maxValue?: number;
};

export type SdsAnswerValue = boolean | number | null | undefined;

export type SdsAnswerMap = Record<string, SdsAnswerValue>;

export type RiasecScoreMap = Record<RiasecCode, number>;

export type SdsSectionScores = Record<SdsSection, RiasecScoreMap>;

export type SdsCompleteness = {
  expectedItems: number;
  answeredItems: number;
  percentage: number;
};

export type SdsSectionCompleteness = Record<SdsSection, SdsCompleteness>;

export type RankedRiasec = {
  code: RiasecCode;
  score: number;
  rank: number;
};


export type SdsCodeResolution = {
  primarySummaryCode: string;
  alternativeSummaryCodes: string[];
  ambiguous: boolean;
  tieGroups: Array<{
    score: number;
    codes: RiasecCode[];
  }>;
  note?: string;
};

export type SdsValiditySeverity = "info" | "warning" | "critical";

export type SdsValidityStatus =
  | "interpretable"
  | "interpretable_with_caution"
  | "needs_counselor_review"
  | "not_interpretable";

export type SdsValidityFlag = {
  code:
    | "LOW_COMPLETENESS"
    | "TIED_DOMINANT_CODES"
    | "LOW_DIFFERENTIATION"
    | "FLAT_PROFILE"
    | "TOO_FEW_SELECTIONS"
    | "TOO_MANY_SELECTIONS"
    | "SELF_ESTIMATE_OVERCLAIM"
    | "SELF_ESTIMATE_UNDERCLAIM"
    | "SELF_ESTIMATE_LOW_VARIANCE"
    | "LOW_SECTION_CONSISTENCY";
  severity: SdsValiditySeverity;
  message: string;
  evidence?: Record<string, unknown>;
};

export type SdsValidityReport = {
  status: SdsValidityStatus;
  score: number;
  label: string;
  flags: SdsValidityFlag[];
  summary: string;
};


export type MajorMap = {
  labels: Record<RiasecCode, string>;
  descriptions: Record<RiasecCode, string>;
  clustersByCode: Record<RiasecCode, string[]>;
  clustersByCombo: Record<string, string[]>;
};

export type SdsInterpretation = {
  headline: string;
  profileSummary: string;
  codeDescriptions: Array<{
    code: RiasecCode;
    label: string;
    description: string;
  }>;
  suggestedMajorClusters: string[];
  counselingNotes: string[];
};

export type SdsEngineConfig = {
  lowDifferentiationGapThreshold: number;
  minimumCompletenessPercentage: number;
};

export type SdsResult = {
  engineVersion: string;
  sectionScores: SdsSectionScores;
  totalScores: RiasecScoreMap;
  rankedCodes: RankedRiasec[];
  summaryCode: string;
  codeResolution: SdsCodeResolution;
  dominantCodes: RiasecCode[];
  sectionCompleteness: SdsSectionCompleteness;
  overallCompleteness: SdsCompleteness;
  validity: SdsValidityReport;
  interpretation: SdsInterpretation;
  warnings: string[];
};
