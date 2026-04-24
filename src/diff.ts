export type EnvMap = Record<string, string>;

export interface DiffResult {
  key: string;
  status: 'added' | 'removed' | 'changed';
  valueA: string | undefined;
  valueB: string | undefined;
}

export interface StageDiff {
  stageA: string;
  stageB: string;
  diffs: DiffResult[];
}

export function diffEnvMaps(mapA: EnvMap, mapB: EnvMap): DiffResult[] {
  const results: DiffResult[] = [];
  const allKeys = new Set([...Object.keys(mapA), ...Object.keys(mapB)]);

  for (const key of Array.from(allKeys).sort()) {
    const valA = mapA[key];
    const valB = mapB[key];

    if (valA === undefined && valB !== undefined) {
      results.push({ key, status: 'added', valueA: undefined, valueB: valB });
    } else if (valA !== undefined && valB === undefined) {
      results.push({ key, status: 'removed', valueA: valA, valueB: undefined });
    } else if (valA !== valB) {
      results.push({ key, status: 'changed', valueA: valA, valueB: valB });
    }
  }

  return results;
}

export function diffStages(
  stages: Record<string, EnvMap>,
  stageA: string,
  stageB: string
): StageDiff {
  const mapA = stages[stageA];
  const mapB = stages[stageB];

  if (!mapA) throw new Error(`Stage not found: ${stageA}`);
  if (!mapB) throw new Error(`Stage not found: ${stageB}`);

  return {
    stageA,
    stageB,
    diffs: diffEnvMaps(mapA, mapB),
  };
}
