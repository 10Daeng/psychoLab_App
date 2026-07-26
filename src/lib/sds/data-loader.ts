import rawItems from "./data/sds-items.id.json";
import rawMajorMap from "./data/major-map.id.json";

import type { MajorMap, SdsItem } from "./types";
import { validateMajorMap, validateSdsItems } from "./validation";

export const SDS_ITEMS = validateSdsItems(rawItems as SdsItem[]);

export const SDS_MAJOR_MAP = validateMajorMap(rawMajorMap as MajorMap);
