// env-scope.ts — filter and extract env vars by scope (prefix group)

export interface ScopeResult {
  scope: string;
  keys: string[];
  entries: Record<string, string>;
}

/**
 * Extract all keys belonging to a given scope prefix (e.g. "DB_" or "AWS_").
 */
export function extractScope(
  envMap: Record<string, string>,
  scope: string
): ScopeResult {
  const prefix = scope.endsWith('_') ? scope : `${scope}_`;
  const entries: Record<string, string> = {};
  for (const [key, value] of Object.entries(envMap)) {
    if (key.startsWith(prefix)) {
      entries[key] = value;
    }
  }
  return { scope: prefix, keys: Object.keys(entries), entries };
}

/**
 * List all unique scope prefixes present in an env map.
 * A scope is the portion before the first underscore.
 */
export function listScopes(envMap: Record<string, string>): string[] {
  const scopes = new Set<string>();
  for (const key of Object.keys(envMap)) {
    const idx = key.indexOf('_');
    if (idx > 0) {
      scopes.add(key.slice(0, idx));
    }
  }
  return Array.from(scopes).sort();
}

/**
 * Partition an env map into scope buckets.
 */
export function partitionByScope(
  envMap: Record<string, string>
): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  for (const [key, value] of Object.entries(envMap)) {
    const idx = key.indexOf('_');
    const scope = idx > 0 ? key.slice(0, idx) : '__UNSCOPED__';
    if (!result[scope]) result[scope] = {};
    result[scope][key] = value;
  }
  return result;
}

/**
 * Format a human-readable scope summary.
 */
export function formatScopeSummary(
  partitioned: Record<string, Record<string, string>>
): string {
  const lines: string[] = ['Scope Summary', '='.repeat(40)];
  for (const [scope, entries] of Object.entries(partitioned)) {
    const count = Object.keys(entries).length;
    lines.push(`  ${scope.padEnd(20)} ${count} key${count !== 1 ? 's' : ''}`);
  }
  return lines.join('\n');
}
