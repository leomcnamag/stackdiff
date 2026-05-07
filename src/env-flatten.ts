/**
 * env-flatten: flatten nested/prefixed env keys into a flat map,
 * or expand a flat map back into grouped structure.
 */

export type EnvMap = Record<string, string>;
export type FlattenResult = {
  flattened: EnvMap;
  groups: Record<string, EnvMap>;
  separator: string;
};

/**
 * Flatten grouped env maps into a single flat map with prefix keys.
 */
export function flattenEnvGroups(
  groups: Record<string, EnvMap>,
  separator = "__"
): FlattenResult {
  const flattened: EnvMap = {};
  for (const [group, entries] of Object.entries(groups)) {
    for (const [key, value] of Object.entries(entries)) {
      flattened[`${group}${separator}${key}`] = value;
    }
  }
  return { flattened, groups, separator };
}

/**
 * Expand a flat env map into groups based on a separator prefix.
 */
export function expandEnvMap(
  flat: EnvMap,
  separator = "__"
): Record<string, EnvMap> {
  const groups: Record<string, EnvMap> = {};
  for (const [key, value] of Object.entries(flat)) {
    const idx = key.indexOf(separator);
    if (idx === -1) {
      groups["__root__"] = groups["__root__"] ?? {};
      groups["__root__"][key] = value;
    } else {
      const prefix = key.slice(0, idx);
      const rest = key.slice(idx + separator.length);
      groups[prefix] = groups[prefix] ?? {};
      groups[prefix][rest] = value;
    }
  }
  return groups;
}

/**
 * Format a flatten result as a human-readable summary.
 */
export function formatFlattenResult(result: FlattenResult): string {
  const lines: string[] = [];
  const groupNames = Object.keys(result.groups);
  lines.push(`Flattened ${groupNames.length} group(s) using separator "${result.separator}"`);
  for (const group of groupNames) {
    const count = Object.keys(result.groups[group]).length;
    lines.push(`  ${group}: ${count} key(s)`);
  }
  lines.push(`Total keys: ${Object.keys(result.flattened).length}`);
  return lines.join("\n");
}
