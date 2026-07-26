import { RIASEC_CODES } from "./types";
import type { RiasecCode, RiasecScoreMap, SdsCodeResolution } from "./types";

/**
 * Menyelesaikan kode ringkasan SDS dengan perlakuan khusus untuk skor sama.
 *
 * Prinsip:
 * - Jika skor tidak seri, hasil normal. Contoh: SIC.
 * - Jika skor seri di posisi dominan, hasil tidak dipaksa jadi satu kode.
 * - Engine menyimpan kode utama dan kode alternatif.
 * - Urutan RIASEC hanya dipakai agar output stabil secara teknis, bukan untuk
 *   menyatakan bahwa satu huruf "lebih benar" dari huruf seri lainnya.
 */
export function resolveSummaryCodes(
  totalScores: RiasecScoreMap
): SdsCodeResolution {
  const groups = groupCodesByScore(totalScores);
  const selectedGroups = collectGroupsUntilAtLeastThreeCodes(groups);
  const candidateCodes = buildCandidateCodesFromGroups(selectedGroups);

  const primarySummaryCode = candidateCodes[0] ?? "";
  const alternativeSummaryCodes = candidateCodes.slice(1);
  const tieGroups = groups.filter((group) => group.codes.length > 1);
  const ambiguous = alternativeSummaryCodes.length > 0;

  return {
    primarySummaryCode,
    alternativeSummaryCodes,
    ambiguous,
    tieGroups,
    note: ambiguous
      ? "Ada skor yang sama pada kode dominan. Interpretasi perlu membaca beberapa kemungkinan kode, bukan satu kode tunggal."
      : undefined,
  };
}

function groupCodesByScore(totalScores: RiasecScoreMap) {
  const scoreMap = new Map<number, RiasecCode[]>();

  for (const code of RIASEC_CODES) {
    const score = totalScores[code];

    if (!scoreMap.has(score)) {
      scoreMap.set(score, []);
    }

    scoreMap.get(score)?.push(code);
  }

  return Array.from(scoreMap.entries())
    .map(([score, codes]) => ({
      score,
      codes,
    }))
    .sort((a, b) => b.score - a.score);
}

function collectGroupsUntilAtLeastThreeCodes(
  groups: Array<{ score: number; codes: RiasecCode[] }>
) {
  const selected: Array<{ score: number; codes: RiasecCode[] }> = [];
  let count = 0;

  for (const group of groups) {
    selected.push(group);
    count += group.codes.length;

    if (count >= 3) break;
  }

  return selected;
}

function buildCandidateCodesFromGroups(
  groups: Array<{ score: number; codes: RiasecCode[] }>
): string[] {
  if (groups.length === 0) return [];

  const expanded = expandRespectingScoreGroups(groups)
    .map((code) => code.slice(0, 3))
    .filter((code) => code.length === 3);

  return Array.from(new Set(expanded));
}

function expandRespectingScoreGroups(
  groups: Array<{ score: number; codes: RiasecCode[] }>
): string[] {
  let partials = [""];

  for (const group of groups) {
    const permutations = permute(group.codes);
    const next: string[] = [];

    for (const partial of partials) {
      for (const permutation of permutations) {
        next.push(partial + permutation.join(""));
      }
    }

    partials = next;
  }

  return partials;
}

function permute<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];

  const result: T[][] = [];

  for (let i = 0; i < items.length; i++) {
    const current = items[i];
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];

    for (const permutation of permute(rest)) {
      result.push([current, ...permutation]);
    }
  }

  return result;
}
