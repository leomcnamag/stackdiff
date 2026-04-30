/**
 * env-sort.ts
 * Utilities for sorting environment variable maps by key or value,
 * with support for grouping by prefix and custom ordering.
 */

export type SortOrder = 'asc' | 'desc';
export type SortBy = 'key' | 'value';

export interface SortOptions {
  by?: SortBy;
  order?: SortOrder;
  groupByPrefix?: boolean;
  prefixDelimiter?: string;
}

export interface SortedEnvGroup {
  prefix: string;
  entries: [string, string][];
}

export function sortEnvMap(
  env: Record<string, string>,
  options: SortOptions = {}
): Record<string, string> {
  const { by = 'key', order = 'asc' } = options;

  const entries = Object.entries(env);

  entries.sort(([ka, va], [kb, vb]) => {
    const a = by === 'key' ? ka : va;
    const b = by === 'key' ? kb : vb;
    const cmp = a.localeCompare(b);
    return order === 'asc' ? cmp : -cmp;
  });

  return Object.fromEntries(entries);
}

export function groupByPrefix(
  env: Record<string, string>,
  delimiter = '_'
): SortedEnvGroup[] {
  const groups = new Map<string, [string, string][]>();

  for (const [key, value] of Object.entries(env)) {
    const idx = key.indexOf(delimiter);
    const prefix = idx !== -1 ? key.slice(0, idx) : '__UNGROUPED__';
    if (!groups.has(prefix)) groups.set(prefix, []);
    groups.get(prefix)!.push([key, value]);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([prefix, entries]) => ({
      prefix,
      entries: entries.sort(([a], [b]) => a.localeCompare(b)),
    }));
}

export function sortStages(
  stages: Record<string, Record<string, string>>,
  options: SortOptions = {}
): Record<string, Record<string, string>> {
  return Object.fromEntries(
    Object.entries(stages).map(([stage, env]) => [stage, sortEnvMap(env, options)])
  );
}
