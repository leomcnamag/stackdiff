/**
 * Filter and search utilities for env var diffs
 */

export interface FilterOptions {
  keys?: string[];        // only include these keys
  exclude?: string[];     // exclude these keys
  pattern?: string;       // glob-style prefix match
  onlyChanged?: boolean;  // only show keys that differ between stages
  onlyMissing?: boolean;  // only show keys missing in at least one stage
}

export type EnvMap = Record<string, string | undefined>;
export type StageMap = Record<string, EnvMap>;

/**
 * Returns true if the key matches the given pattern (prefix glob: "DB_*").
 */
export function matchesPattern(key: string, pattern: string): boolean {
  if (pattern.endsWith('*')) {
    return key.startsWith(pattern.slice(0, -1));
  }
  return key === pattern;
}

/**
 * Filter a StageMap based on FilterOptions.
 * Returns a new StageMap with only the matching keys.
 */
export function filterStages(stages: StageMap, opts: FilterOptions): StageMap {
  const allKeys = new Set(Object.values(stages).flatMap(m => Object.keys(m)));

  const keysToKeep = [...allKeys].filter(key => {
    if (opts.keys && opts.keys.length > 0) {
      if (!opts.keys.includes(key)) return false;
    }
    if (opts.exclude && opts.exclude.includes(key)) return false;
    if (opts.pattern && !matchesPattern(key, opts.pattern)) return false;

    if (opts.onlyChanged) {
      const values = Object.values(stages).map(m => m[key]);
      const unique = new Set(values);
      if (unique.size <= 1) return false;
    }

    if (opts.onlyMissing) {
      const hasMissing = Object.values(stages).some(m => m[key] === undefined);
      if (!hasMissing) return false;
    }

    return true;
  });

  const keySet = new Set(keysToKeep);
  const result: StageMap = {};

  for (const [stage, envMap] of Object.entries(stages)) {
    result[stage] = {};
    for (const key of keySet) {
      result[stage][key] = envMap[key];
    }
  }

  return result;
}
