import { EnvMap } from './parser';

export interface EnvStats {
  totalKeys: number;
  emptyValues: number;
  uniqueValues: number;
  duplicateValues: number;
  avgValueLength: number;
  longestKey: string;
  longestValue: string;
  prefixes: Record<string, number>;
}

export function computeEnvStats(env: EnvMap): EnvStats {
  const keys = Object.keys(env);
  const values = Object.values(env);

  const emptyValues = values.filter(v => v === '').length;
  const valueCounts = new Map<string, number>();
  for (const v of values) {
    valueCounts.set(v, (valueCounts.get(v) ?? 0) + 1);
  }
  const uniqueValues = [...valueCounts.values()].filter(c => c === 1).length;
  const duplicateValues = values.length - uniqueValues - emptyValues;

  const totalLen = values.reduce((sum, v) => sum + v.length, 0);
  const avgValueLength = keys.length > 0 ? Math.round(totalLen / keys.length) : 0;

  const longestKey = keys.reduce((a, b) => (b.length > a.length ? b : a), '');
  const longestValue = values.reduce((a, b) => (b.length > a.length ? b : a), '');

  const prefixes: Record<string, number> = {};
  for (const key of keys) {
    const parts = key.split('_');
    if (parts.length > 1) {
      const prefix = parts[0];
      prefixes[prefix] = (prefixes[prefix] ?? 0) + 1;
    }
  }

  return {
    totalKeys: keys.length,
    emptyValues,
    uniqueValues,
    duplicateValues: Math.max(0, duplicateValues),
    avgValueLength,
    longestKey,
    longestValue,
    prefixes,
  };
}

export function formatEnvStats(stats: EnvStats, stage?: string): string {
  const header = stage ? `Stats for [${stage}]` : 'Env Stats';
  const lines: string[] = [
    `${header}`,
    `  Total keys:       ${stats.totalKeys}`,
    `  Empty values:     ${stats.emptyValues}`,
    `  Unique values:    ${stats.uniqueValues}`,
    `  Duplicate values: ${stats.duplicateValues}`,
    `  Avg value length: ${stats.avgValueLength}`,
    `  Longest key:      ${stats.longestKey || '(none)'}`,
  ];
  const topPrefixes = Object.entries(stats.prefixes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([p, c]) => `${p}(${c})`)
    .join(', ');
  if (topPrefixes) lines.push(`  Top prefixes:     ${topPrefixes}`);
  return lines.join('\n');
}

export function compareEnvStats(
  a: EnvStats,
  b: EnvStats,
  stageA: string,
  stageB: string
): string {
  const lines: string[] = [`Comparing stats: ${stageA} vs ${stageB}`];
  const delta = (label: string, va: number, vb: number) => {
    const diff = vb - va;
    const sign = diff > 0 ? '+' : '';
    lines.push(`  ${label.padEnd(20)} ${String(va).padStart(5)}  →  ${String(vb).padStart(5)}  (${sign}${diff})`);
  };
  delta('Total keys:', a.totalKeys, b.totalKeys);
  delta('Empty values:', a.emptyValues, b.emptyValues);
  delta('Unique values:', a.uniqueValues, b.uniqueValues);
  delta('Avg value length:', a.avgValueLength, b.avgValueLength);
  return lines.join('\n');
}
