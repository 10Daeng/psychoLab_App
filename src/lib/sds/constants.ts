import type { SdsEngineConfig, SdsSection } from "./types";

export const SDS_ENGINE_VERSION = "1.0.0";

export const DEFAULT_SDS_ENGINE_CONFIG: SdsEngineConfig = {
  lowDifferentiationGapThreshold: 3,
  minimumCompletenessPercentage: 80,
};

export const SECTION_LABELS: Record<SdsSection, string> = {
  activities: "A. Aktivitas",
  competencies: "B. Kompetensi",
  occupations: "C. Pekerjaan",
  selfEstimates: "D. Menilai Diri",
};
