import { EnvMap } from './parser';

export interface CopyOptions {
  keys?: string[];
  prefix?: string;
  overwrite?: boolean;
  stripPrefix?: boolean;
}

export interface CopyResult {
  copied: string[];
  skipped: string[];
  target: EnvMap;
}

export function copyEnvKeys(
  source: EnvMap,
  target: EnvMap,
  options: CopyOptions = {}
): CopyResult {
  const { keys, prefix, overwrite = false, stripPrefix = false } = options;
  const copied: string[] = [];
  const skipped: string[] = [];
  const result: EnvMap = { ...target };

  const sourceEntries = Object.entries(source).filter(([key]) => {
    if (keys && keys.length > 0) return keys.includes(key);
    if (prefix) return key.startsWith(prefix);
    return true;
  });

  for (const [key, value] of sourceEntries) {
    const targetKey = stripPrefix && prefix && key.startsWith(prefix)
      ? key.slice(prefix.length)
      : key;

    if (!overwrite && targetKey in result) {
      skipped.push(key);
      continue;
    }

    result[targetKey] = value;
    copied.push(key);
  }

  return { copied, skipped, target: result };
}

export function formatCopyResult(result: CopyResult): string {
  const lines: string[] = [];
  lines.push(`Copied:  ${result.copied.length} key(s)`);
  if (result.copied.length > 0) {
    result.copied.forEach(k => lines.push(`  + ${k}`));
  }
  if (result.skipped.length > 0) {
    lines.push(`Skipped: ${result.skipped.length} key(s) (already exist, use --overwrite)`);
    result.skipped.forEach(k => lines.push(`  ~ ${k}`));
  }
  return lines.join('\n');
}
