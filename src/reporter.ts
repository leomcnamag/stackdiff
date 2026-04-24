/**
 * Reporter: aggregates diff stats and produces a summary report.
 */

import type { StageMap } from './filter';

export interface DiffStats {
  totalKeys: number;
  changedKeys: number;
  missingKeys: number;
  addedKeys: number;   // present in later stage, absent in earlier
  stages: string[];
}

export interface StagePair {
  from: string;
  to: string;
}

/**
 * Compute diff statistics between two stages.
 */
export function computeStats(stages: StageMap, pair: StagePair): DiffStats {
  const { from, to } = pair;
  const fromMap = stages[from] ?? {};
  const toMap = stages[to] ?? {};

  const allKeys = new Set([...Object.keys(fromMap), ...Object.keys(toMap)]);
  let changed = 0;
  let missing = 0;
  let added = 0;

  for (const key of allKeys) {
    const inFrom = key in fromMap && fromMap[key] !== undefined;
    const inTo = key in toMap && toMap[key] !== undefined;

    if (inFrom && !inTo) missing++;
    else if (!inFrom && inTo) added++;
    else if (inFrom && inTo && fromMap[key] !== toMap[key]) changed++;
  }

  return {
    totalKeys: allKeys.size,
    changedKeys: changed,
    missingKeys: missing,
    addedKeys: added,
    stages: [from, to],
  };
}

/**
 * Format stats as a human-readable summary string.
 */
export function formatStats(stats: DiffStats): string {
  const [from, to] = stats.stages;
  const lines = [
    `Summary: ${from} → ${to}`,
    `  Total keys : ${stats.totalKeys}`,
    `  Changed    : ${stats.changedKeys}`,
    `  Missing    : ${stats.missingKeys}`,
    `  Added      : ${stats.addedKeys}`,
  ];
  return lines.join('\n');
}
