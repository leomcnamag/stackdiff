import { EnvMap } from './parser';
import { diffEnvMaps, EnvDiff } from './diff';

export interface PromoteResult {
  source: string;
  target: string;
  promoted: Record<string, string>;
  skipped: Record<string, string>;
  conflicts: Record<string, { source: string; target: string }>;
  diff: EnvDiff;
}

export interface PromoteOptions {
  overwrite?: boolean;
  keys?: string[];
  dryRun?: boolean;
}

export function promoteEnvMap(
  source: EnvMap,
  target: EnvMap,
  sourceName: string,
  targetName: string,
  options: PromoteOptions = {}
): PromoteResult {
  const { overwrite = false, keys } = options;
  const promoted: Record<string, string> = {};
  const skipped: Record<string, string> = {};
  const conflicts: Record<string, { source: string; target: string }> = {};

  const sourceKeys = keys ? keys.filter(k => k in source) : Object.keys(source);

  for (const key of sourceKeys) {
    const sourceVal = source[key];
    if (key in target && target[key] !== sourceVal) {
      if (overwrite) {
        promoted[key] = sourceVal;
      } else {
        conflicts[key] = { source: sourceVal, target: target[key] };
      }
    } else if (!(key in target)) {
      promoted[key] = sourceVal;
    } else {
      skipped[key] = sourceVal;
    }
  }

  const merged = options.dryRun ? target : { ...target, ...promoted };
  const diff = diffEnvMaps(target, merged, targetName);

  return { source: sourceName, target: targetName, promoted, skipped, conflicts, diff };
}

export function formatPromoteResult(result: PromoteResult): string {
  const lines: string[] = [];
  lines.push(`Promote: ${result.source} → ${result.target}`);
  lines.push('');

  const promotedKeys = Object.keys(result.promoted);
  if (promotedKeys.length > 0) {
    lines.push(`Promoted (${promotedKeys.length}):`);
    for (const key of promotedKeys) {
      lines.push(`  + ${key}=${result.promoted[key]}`);
    }
    lines.push('');
  }

  const conflictKeys = Object.keys(result.conflicts);
  if (conflictKeys.length > 0) {
    lines.push(`Conflicts (${conflictKeys.length}):`);
    for (const key of conflictKeys) {
      const { source, target } = result.conflicts[key];
      lines.push(`  ! ${key}: source=${source} target=${target}`);
    }
    lines.push('');
  }

  const skippedKeys = Object.keys(result.skipped);
  if (skippedKeys.length > 0) {
    lines.push(`Skipped (identical) (${skippedKeys.length}):`);
    for (const key of skippedKeys) {
      lines.push(`  = ${key}`);
    }
  }

  return lines.join('\n');
}
