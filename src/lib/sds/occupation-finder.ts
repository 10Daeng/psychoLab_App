import rawOccupations from "./data/occupations.id.json";

export type RiasecLetter = "R" | "I" | "A" | "S" | "E" | "C";

export type Occupation = {
  id: string;
  title: string;
  riasecCode: string;
  primaryCode: RiasecLetter;
  secondaryCode: RiasecLetter;
  tertiaryCode: RiasecLetter;
  anzscoCodes: string[];
  skillLevel: number;
  skillLevelDescription: string;
  sourcePage?: number;
  source?: string;
};

export type OccupationMatchType =
  | "exact"
  | "same_letters"
  | "same_first_two"
  | "same_primary"
  | "keyword"
  | "weak";

export type OccupationMatch = Occupation & {
  matchScore: number;
  matchType: OccupationMatchType;
  matchedBy: string[];
};

export type OccupationSearchOptions = {
  limit?: number;
  includeWeakMatches?: boolean;
  keyword?: string;
  skillLevels?: number[];
};

/**
 * Menghasilkan semua variasi dari kode 3 huruf.
 * Contoh: "SIC" => ["SIC", "SCI", "ISC", "ICS", "CSI", "CIS"].
 */
export function getCodePermutations(summaryCode: string): string[] {
  const normalizedCode = normalizeRiasecCode(summaryCode);

  if (normalizedCode.length !== 3) {
    return normalizedCode ? [normalizedCode] : [];
  }

  const [a, b, c] = normalizedCode.split("");
  const result = new Set<string>();

  for (const first of [a, b, c]) {
    for (const second of [a, b, c]) {
      for (const third of [a, b, c]) {
        if (first !== second && first !== third && second !== third) {
          result.add(`${first}${second}${third}`);
        }
      }
    }
  }

  return Array.from(result);
}

/**
 * Fungsi utama untuk mencari pekerjaan berdasarkan kode SDS/RIASEC.
 */
export function findOccupationsBySdsCode(
  summaryCode: string,
  options: OccupationSearchOptions = {}
): OccupationMatch[] {
  const normalizedCode = normalizeRiasecCode(summaryCode);
  const keyword = normalizeText(options.keyword ?? "");
  const permutations = getCodePermutations(normalizedCode);
  const occupations = rawOccupations as Occupation[];

  const matches = occupations
    .filter((occupation) => {
      if (!options.skillLevels || options.skillLevels.length === 0) {
        return true;
      }

      return options.skillLevels.includes(occupation.skillLevel);
    })
    .map((occupation) => {
      const match = scoreOccupationMatch({
        occupation,
        summaryCode: normalizedCode,
        permutations,
        keyword,
      });

      return {
        ...occupation,
        ...match,
      };
    })
    .filter((occupation) => {
      if (options.includeWeakMatches) {
        return occupation.matchScore > 0;
      }

      return occupation.matchType !== "weak" && occupation.matchScore > 0;
    })
    .sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }

      if (a.skillLevel !== b.skillLevel) {
        return a.skillLevel - b.skillLevel;
      }

      return a.title.localeCompare(b.title);
    });

  return matches.slice(0, options.limit ?? 50);
}


/**
 * Mencari pekerjaan untuk banyak kemungkinan kode SDS.
 * Berguna ketika skor seri menghasilkan kode utama dan kode alternatif.
 */
export function findOccupationsBySdsCodes(
  summaryCodes: string[],
  options: OccupationSearchOptions = {}
): OccupationMatch[] {
  const merged = new Map<string, OccupationMatch>();

  for (const code of summaryCodes) {
    const matches = findOccupationsBySdsCode(code, {
      ...options,
      limit: undefined,
    });

    for (const match of matches) {
      const existing = merged.get(match.id);

      if (!existing || match.matchScore > existing.matchScore) {
        merged.set(match.id, match);
      }
    }
  }

  return Array.from(merged.values())
    .sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }

      if (a.skillLevel !== b.skillLevel) {
        return a.skillLevel - b.skillLevel;
      }

      return a.title.localeCompare(b.title);
    })
    .slice(0, options.limit ?? 50);
}


/**
 * Mencari pekerjaan dengan kata kunci saja.
 * Berguna untuk fitur search box: "psikolog", "data", "teacher", dll.
 */
export function searchOccupationsByKeyword(
  keyword: string,
  options: Pick<OccupationSearchOptions, "limit" | "skillLevels"> = {}
): OccupationMatch[] {
  return findOccupationsBySdsCode("", {
    ...options,
    keyword,
    includeWeakMatches: true,
  }).filter((occupation) => occupation.matchedBy.includes("keyword"));
}

/**
 * Mengambil pekerjaan berdasarkan kode RIASEC spesifik.
 * Contoh: getOccupationsByExactCode("SIC").
 */
export function getOccupationsByExactCode(
  riasecCode: string,
  options: Pick<OccupationSearchOptions, "limit" | "skillLevels"> = {}
): Occupation[] {
  const normalizedCode = normalizeRiasecCode(riasecCode);
  const occupations = rawOccupations as Occupation[];

  return occupations
    .filter((occupation) => occupation.riasecCode === normalizedCode)
    .filter((occupation) => {
      if (!options.skillLevels || options.skillLevels.length === 0) {
        return true;
      }

      return options.skillLevels.includes(occupation.skillLevel);
    })
    .sort((a, b) => {
      if (a.skillLevel !== b.skillLevel) {
        return a.skillLevel - b.skillLevel;
      }

      return a.title.localeCompare(b.title);
    })
    .slice(0, options.limit ?? 100);
}

export function getOccupationDatabaseStats() {
  const occupations = rawOccupations as Occupation[];

  const byRiasecCode: Record<string, number> = {};
  const byPrimaryCode: Record<string, number> = {};
  const bySkillLevel: Record<string, number> = {};

  for (const occupation of occupations) {
    byRiasecCode[occupation.riasecCode] =
      (byRiasecCode[occupation.riasecCode] ?? 0) + 1;

    byPrimaryCode[occupation.primaryCode] =
      (byPrimaryCode[occupation.primaryCode] ?? 0) + 1;

    bySkillLevel[String(occupation.skillLevel)] =
      (bySkillLevel[String(occupation.skillLevel)] ?? 0) + 1;
  }

  return {
    total: occupations.length,
    byRiasecCode,
    byPrimaryCode,
    bySkillLevel,
  };
}

function scoreOccupationMatch(params: {
  occupation: Occupation;
  summaryCode: string;
  permutations: string[];
  keyword: string;
}): Pick<OccupationMatch, "matchScore" | "matchType" | "matchedBy"> {
  const { occupation, summaryCode, permutations, keyword } = params;

  let score = 0;
  let matchType: OccupationMatchType = "weak";
  const matchedBy: string[] = [];

  if (summaryCode.length === 3) {
    if (occupation.riasecCode === summaryCode) {
      score += 100;
      matchType = "exact";
      matchedBy.push("exact_code");
    } else if (permutations.includes(occupation.riasecCode)) {
      score += 75;
      matchType = "same_letters";
      matchedBy.push("same_three_letters");
    }

    if (occupation.riasecCode.slice(0, 2) === summaryCode.slice(0, 2)) {
      score += 35;
      if (matchType === "weak") matchType = "same_first_two";
      matchedBy.push("same_first_two_letters");
    }

    if (occupation.primaryCode === summaryCode[0]) {
      score += 20;
      if (matchType === "weak") matchType = "same_primary";
      matchedBy.push("same_primary_letter");
    }

    if (occupation.secondaryCode === summaryCode[1]) {
      score += 8;
      matchedBy.push("same_secondary_letter");
    }

    if (occupation.tertiaryCode === summaryCode[2]) {
      score += 5;
      matchedBy.push("same_tertiary_letter");
    }
  }

  if (keyword) {
    const searchableText = normalizeText([
      occupation.title,
      occupation.riasecCode,
      occupation.anzscoCodes.join(" "),
      occupation.skillLevelDescription,
    ].join(" "));

    if (searchableText.includes(keyword)) {
      score += 60;
      if (matchType === "weak") matchType = "keyword";
      matchedBy.push("keyword");
    }
  }

  return {
    matchScore: score,
    matchType,
    matchedBy,
  };
}

function normalizeRiasecCode(code: string): string {
  return code
    .toUpperCase()
    .replace(/[^RIASEC]/g, "")
    .slice(0, 3);
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
