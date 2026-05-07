import { EnvMap } from './parser';

export interface DiffSummaryEntry {
  key: string;
  status: 'added' | 'removed' | 'changed' | 'unchanged';
  fromValue?: string;
  toValue?: string;
}

export interface DiffSummary {
  fromStage: string;
  toStage: string;
  entries: DiffSummaryEntry[];
  addedCount: number;
  removedCount: number;
  changedCount: number;
  unchangedCount: number;
}

export function buildDiffSummary(
  fromStage: string,
  fromMap: EnvMap,
  toStage: string,
  toMap: EnvMap
): DiffSummary {
  const allKeys = new Set([...Object.keys(fromMap), ...Object.keys(toMap)]);
  const entries: DiffSummaryEntry[] = [];

  for (const key of Array.from(allKeys).sort()) {
    const fromValue = fromMap[key];
    const toValue = toMap[key];

    if (fromValue === undefined) {
      entries.push({ key, status: 'added', toValue });
    } else if (toValue === undefined) {
      entries.push({ key, status: 'removed', fromValue });
    } else if (fromValue !== toValue) {
      entries.push({ key, status: 'changed', fromValue, toValue });
    } else {
      entries.push({ key, status: 'unchanged', fromValue, toValue });
    }
  }

  return {
    fromStage,
    toStage,
    entries,
    addedCount: entries.filter(e => e.status === 'added').length,
    removedCount: entries.filter(e => e.status === 'removed').length,
    changedCount: entries.filter(e => e.status === 'changed').length,
    unchangedCount: entries.filter(e => e.status === 'unchanged').length,
  };
}

export function formatDiffSummary(summary: DiffSummary, showUnchanged = false): string {
  const lines: string[] = [
    `Diff: ${summary.fromStage} → ${summary.toStage}`,
    `  +${summary.addedCount} added  -${summary.removedCount} removed  ~${summary.changedCount} changed  =${summary.unchangedCount} unchanged`,
    '',
  ];

  for (const entry of summary.entries) {
    if (entry.status === 'unchanged' && !showUnchanged) continue;
    const prefix =
      entry.status === 'added' ? '+' :
      entry.status === 'removed' ? '-' :
      entry.status === 'changed' ? '~' : '=';
    if (entry.status === 'changed') {
      lines.push(`  ${prefix} ${entry.key}: "${entry.fromValue}" → "${entry.toValue}"`);
    } else if (entry.status === 'added') {
      lines.push(`  ${prefix} ${entry.key}: "${entry.toValue}"`);
    } else if (entry.status === 'removed') {
      lines.push(`  ${prefix} ${entry.key}: "${entry.fromValue}"`);
    } else {
      lines.push(`  ${prefix} ${entry.key}: "${entry.fromValue}"`);
    }
  }

  return lines.join('\n');
}
