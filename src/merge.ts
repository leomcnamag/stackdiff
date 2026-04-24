import { EnvMap } from './parser';

export interface MergeOptions {
  strategy: 'left' | 'right' | 'union' | 'intersection';
  prefix?: string;
}

export interface MergeResult {
  merged: EnvMap;
  conflicts: Record<string, { left: string; right: string }>;
  added: string[];
  dropped: string[];
}

export function mergeEnvMaps(
  left: EnvMap,
  right: EnvMap,
  options: MergeOptions = { strategy: 'union' }
): MergeResult {
  const merged: EnvMap = {};
  const conflicts: Record<string, { left: string; right: string }> = {};
  const added: string[] = [];
  const dropped: string[] = [];

  const allKeys = new Set([...Object.keys(left), ...Object.keys(right)]);

  for (const key of allKeys) {
    const inLeft = key in left;
    const inRight = key in right;

    if (inLeft && inRight) {
      if (left[key] !== right[key]) {
        conflicts[key] = { left: left[key], right: right[key] };
      }
      if (options.strategy === 'right') {
        merged[key] = right[key];
      } else {
        merged[key] = left[key];
      }
    } else if (inLeft && !inRight) {
      if (options.strategy !== 'intersection') {
        merged[key] = left[key];
      } else {
        dropped.push(key);
      }
    } else if (!inLeft && inRight) {
      if (options.strategy !== 'intersection') {
        merged[key] = right[key];
        added.push(key);
      } else {
        dropped.push(key);
      }
    }
  }

  if (options.prefix) {
    const prefixed: EnvMap = {};
    for (const [k, v] of Object.entries(merged)) {
      prefixed[`${options.prefix}${k}`] = v;
    }
    return { merged: prefixed, conflicts, added, dropped };
  }

  return { merged, conflicts, added, dropped };
}

export function formatMergeResult(result: MergeResult): string {
  const lines: string[] = [];
  const conflictCount = Object.keys(result.conflicts).length;

  lines.push(`Merged: ${Object.keys(result.merged).length} keys`);
  lines.push(`Added from right: ${result.added.length}`);
  lines.push(`Dropped (intersection): ${result.dropped.length}`);
  lines.push(`Conflicts: ${conflictCount}`);

  if (conflictCount > 0) {
    lines.push('');
    lines.push('Conflicts (left kept):');
    for (const [key, { left, right }] of Object.entries(result.conflicts)) {
      lines.push(`  ${key}: "${left}" vs "${right}"`);
    }
  }

  return lines.join('\n');
}
