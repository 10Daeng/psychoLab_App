import {
  RIASEC_CODES,
  SDS_SECTIONS,
  type MajorMap,
  type SdsItem,
} from "./types";

const RIASEC_SET = new Set<string>(RIASEC_CODES);
const SECTION_SET = new Set<string>(SDS_SECTIONS);

export function validateSdsItems(items: SdsItem[]): SdsItem[] {
  if (!Array.isArray(items)) {
    throw new Error("SDS items harus berupa array.");
  }

  const ids = new Set<string>();

  for (const item of items) {
    if (!item.id || typeof item.id !== "string") {
      throw new Error("Setiap item SDS wajib memiliki id string.");
    }

    if (ids.has(item.id)) {
      throw new Error(`Duplikat id item SDS: ${item.id}`);
    }

    ids.add(item.id);

    if (!SECTION_SET.has(item.section)) {
      throw new Error(`Section item ${item.id} tidak valid: ${item.section}`);
    }

    if (!RIASEC_SET.has(item.code)) {
      throw new Error(`Kode RIASEC item ${item.id} tidak valid: ${item.code}`);
    }

    if (!item.text || typeof item.text !== "string") {
      throw new Error(`Text item ${item.id} wajib diisi.`);
    }

    if (item.scoringType !== "binary" && item.scoringType !== "rating") {
      throw new Error(
        `scoringType item ${item.id} harus "binary" atau "rating".`
      );
    }

    if (item.scoringType === "rating") {
      const min = item.minValue ?? 1;
      const max = item.maxValue ?? 10;

      if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
        throw new Error(`Rentang rating item ${item.id} tidak valid.`);
      }
    }
  }

  return items;
}

export function validateMajorMap(map: MajorMap): MajorMap {
  if (!map || typeof map !== "object") {
    throw new Error("Major map tidak valid.");
  }

  for (const code of RIASEC_CODES) {
    if (!map.labels?.[code]) {
      throw new Error(`labels.${code} wajib diisi.`);
    }

    if (!map.descriptions?.[code]) {
      throw new Error(`descriptions.${code} wajib diisi.`);
    }

    if (!Array.isArray(map.clustersByCode?.[code])) {
      throw new Error(`clustersByCode.${code} wajib berupa array.`);
    }
  }

  if (!map.clustersByCombo || typeof map.clustersByCombo !== "object") {
    throw new Error("clustersByCombo wajib berupa object.");
  }

  return map;
}
