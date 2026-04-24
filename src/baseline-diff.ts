import { EnvMap } from './parser';
import { Baseline } from './baseline';

export interface BaselineDiffEntry {
  key: string;
  baselineValue: string | undefined;
  currentValue: string | undefined;
  status: 'added' | 'removed' | 'changed' | 'unchanged';
}

export interface BaselineDiffResult {
  baselineName: string;
  stage: string;
  baselineDate: string;
  entries: BaselineDiffEntry[];
  addedCount: number;
  removedCount: number;
  changedCount: number;
  unchangedCount: number;
}

export function diffAgainstBaseline(baseline: Baseline, current: EnvMap): BaselineDiffResult {
  const allKeys = new Set([...Object.keys(baseline.vars), ...Object.keys(current)]);
  const entries: BaselineDiffEntry[] = [];

  for (const key of Array.from(allKeys).sort()) {
    const bVal = baseline.vars[key];
    const cVal = current[key];
    let status: BaselineDiffEntry['status'];

    if (bVal === undefined) status = 'added';
    else if (cVal === undefined) status = 'removed';
    else if (bVal !== cVal) status = 'changed';
    else status = 'unchanged';

    entries.push({ key, baselineValue: bVal, currentValue: cVal, status });
  }

  return {
    baselineName: baseline.name,
    stage: baseline.stage,
    baselineDate: baseline.createdAt,
    entries,
    addedCount: entries.filter((e) => e.status === 'added').length,
    removedCount: entries.filter((e) => e.status === 'removed').length,
    changedCount: entries.filter((e) => e.status === 'changed').length,
    unchangedCount: entries.filter((e) => e.status === 'unchanged').length,
  };
}

export function formatBaselineDiff(result: BaselineDiffResult, showUnchanged = false): string {
  const lines: string[] = [
    `Baseline: ${result.baselineName} (${result.stage}) — captured ${result.baselineDate}`,
    `Changes: +${result.addedCount} added, -${result.removedCount} removed, ~${result.changedCount} changed`,
    '',
  ];

  for (const entry of result.entries) {
    if (entry.status === 'unchanged' && !showUnchanged) continue;
    const prefix = { added: '+', removed: '-', changed: '~', unchanged: ' ' }[entry.status];
    if (entry.status === 'changed') {
      lines.push(`${prefix} ${entry.key}: ${entry.baselineValue} → ${entry.currentValue}`);
    } else if (entry.status === 'added') {
      lines.push(`${prefix} ${entry.key}: ${entry.currentValue}`);
    } else if (entry.status === 'removed') {
      lines.push(`${prefix} ${entry.key}: ${entry.baselineValue}`);
    } else {
      lines.push(`${prefix} ${entry.key}: ${entry.currentValue}`);
    }
  }

  return lines.join('\n');
}
