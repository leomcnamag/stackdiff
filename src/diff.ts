import { EnvMap, ParseResult } from "./parser";

export type ChangeKind = "added" | "removed" | "changed" | "unchanged";

export interface VarDiff {
  key: string;
  kind: ChangeKind;
  baseValue?: string;
  targetValue?: string;
}

export interface StageDiff {
  base: string;
  target: string;
  diffs: VarDiff[];
}

/**
 * Computes the diff between two EnvMaps.
 */
export function diffEnvMaps(base: EnvMap, target: EnvMap): VarDiff[] {
  const allKeys = new Set([...Object.keys(base), ...Object.keys(target)]);
  const result: VarDiff[] = [];

  for (const key of Array.from(allKeys).sort()) {
    const inBase = key in base;
    const inTarget = key in target;

    if (inBase && !inTarget) {
      result.push({ key, kind: "removed", baseValue: base[key] });
    } else if (!inBase && inTarget) {
      result.push({ key, kind: "added", targetValue: target[key] });
    } else if (base[key] !== target[key]) {
      result.push({
        key,
        kind: "changed",
        baseValue: base[key],
        targetValue: target[key],
      });
    } else {
      result.push({
        key,
        kind: "unchanged",
        baseValue: base[key],
        targetValue: target[key],
      });
    }
  }

  return result;
}

/**
 * Computes diffs for a list of ParseResults in sequential order.
 * base -> stage[0], stage[0] -> stage[1], etc.
 */
export function diffStages(stages: ParseResult[]): StageDiff[] {
  if (stages.length < 2) return [];

  const result: StageDiff[] = [];
  for (let i = 0; i < stages.length - 1; i++) {
    result.push({
      base: stages[i].stage,
      target: stages[i + 1].stage,
      diffs: diffEnvMaps(stages[i].vars, stages[i + 1].vars),
    });
  }
  return result;
}
