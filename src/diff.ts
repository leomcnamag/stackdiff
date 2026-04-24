export type EntryStatus = 'added' | 'removed' | 'changed' | 'unchanged';

export interface DiffEntry {
  key: string;
  status: EntryStatus;
  baseValue?: string;
  targetValue?: string;
}

export interface DiffResult {
  stage: string;
  entries: DiffEntry[];
}

export type EnvMap = Record<string, string>;

export function diffEnvMaps(base: EnvMap, target: EnvMap): DiffEntry[] {
  const keys = new Set([...Object.keys(base), ...Object.keys(target)]);
  const entries: DiffEntry[] = [];

  for (const key of keys) {
    const inBase = key in base;
    const inTarget = key in target;

    if (inBase && inTarget) {
      if (base[key] !== target[key]) {
        entries.push({ key, status: 'changed', baseValue: base[key], targetValue: target[key] });
      } else {
        entries.push({ key, status: 'unchanged', baseValue: base[key], targetValue: target[key] });
      }
    } else if (inBase) {
      entries.push({ key, status: 'removed', baseValue: base[key] });
    } else {
      entries.push({ key, status: 'added', targetValue: target[key] });
    }
  }

  return entries.sort((a, b) => a.key.localeCompare(b.key));
}

export function diffStages(
  base: EnvMap,
  stages: Record<string, EnvMap>
): DiffResult[] {
  return Object.entries(stages).map(([stage, target]) => ({
    stage,
    entries: diffEnvMaps(base, target),
  }));
}
