import { EnvMap } from './parser';

export interface PruneOptions {
  keepKeys?: string[];
  removeKeys?: string[];
  removeEmpty?: boolean;
  removeDuplicateValues?: boolean;
}

export interface PruneResult {
  pruned: EnvMap;
  removed: Record<string, string>;
  reasons: Record<string, string>;
}

export function pruneEnvMap(env: EnvMap, options: PruneOptions = {}): PruneResult {
  const removed: Record<string, string> = {};
  const reasons: Record<string, string> = {};
  const pruned: EnvMap = {};
  const seenValues = new Set<string>();

  for (const [key, value] of Object.entries(env)) {
    if (options.removeKeys?.includes(key)) {
      removed[key] = value;
      reasons[key] = 'explicitly removed';
      continue;
    }

    if (options.keepKeys && !options.keepKeys.includes(key)) {
      removed[key] = value;
      reasons[key] = 'not in keep list';
      continue;
    }

    if (options.removeEmpty && value.trim() === '') {
      removed[key] = value;
      reasons[key] = 'empty value';
      continue;
    }

    if (options.removeDuplicateValues && seenValues.has(value)) {
      removed[key] = value;
      reasons[key] = 'duplicate value';
      continue;
    }

    seenValues.add(value);
    pruned[key] = value;
  }

  return { pruned, removed, reasons };
}

export function pruneStages(
  stages: Record<string, EnvMap>,
  options: PruneOptions = {}
): Record<string, PruneResult> {
  return Object.fromEntries(
    Object.entries(stages).map(([stage, env]) => [stage, pruneEnvMap(env, options)])
  );
}

export function formatPruneResult(result: PruneResult, stage?: string): string {
  const lines: string[] = [];
  const header = stage ? `Prune result for [${stage}]` : 'Prune result';
  lines.push(header);
  lines.push(`  Kept: ${Object.keys(result.pruned).length} keys`);
  lines.push(`  Removed: ${Object.keys(result.removed).length} keys`);
  for (const [key, reason] of Object.entries(result.reasons)) {
    lines.push(`    - ${key}: ${reason}`);
  }
  return lines.join('\n');
}
