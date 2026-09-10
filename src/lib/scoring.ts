export const DISC_PATTERNS_MAP: Record<string, string> = {
  // Mixed profiles (D dominant)
  DI: 'Inspirational', 
  DS: 'Developer', 
  DC: 'Creative', 
  
  // Mixed profiles (I dominant)
  ID: 'Persuader', 
  IS: 'Counselor', 
  IC: 'Appraiser', 
  
  // Mixed profiles (S dominant)
  SI: 'Agent',
  SD: 'Achiever', 
  SC: 'Practitioner', 
  
  // Mixed profiles (C dominant)
  CD: 'Creative', 
  CI: 'Investigator',
  CS: 'Objective Thinker',
  
  // Single dominant profiles (using doubled letters for consistency or single letter fallbacks)
  DD: 'Result-Oriented', D: 'Result-Oriented',
  II: 'Promoter', I: 'Promoter',
  SS: 'Specialist', S: 'Specialist',
  CC: 'Perfectionist', C: 'Perfectionist',
};

export function getDiscPatternName(patternStr?: string): string {
  if (!patternStr) return 'Unknown';
  
  const key = patternStr.toUpperCase().trim();
  const primaryKeys = key.substring(0, 2);
  
  return DISC_PATTERNS_MAP[primaryKeys] || DISC_PATTERNS_MAP[key.charAt(0)] || 'Professional';
}
