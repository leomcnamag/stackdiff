/**
 * env-alias: create and resolve key aliases across env maps
 */

export type AliasMap = Record<string, string>;

export interface AliasResult {
  original: Record<string, string>;
  aliased: Record<string, string>;
  applied: string[];
  skipped: string[];
}

/**
 * Apply aliases to an env map: for each alias -> canonical mapping,
 * copy the value of the canonical key to the alias key (if canonical exists).
 */
export function applyAliases(
  env: Record<string, string>,
  aliases: AliasMap
): AliasResult {
  const aliased = { ...env };
  const applied: string[] = [];
  const skipped: string[] = [];

  for (const [alias, canonical] of Object.entries(aliases)) {
    if (canonical in env) {
      aliased[alias] = env[canonical];
      applied.push(alias);
    } else {
      skipped.push(alias);
    }
  }

  return { original: env, aliased, applied, skipped };
}

/**
 * Resolve aliases in an env map: replace alias keys with their canonical names.
 * If both exist, canonical takes precedence.
 */
export function resolveAliases(
  env: Record<string, string>,
  aliases: AliasMap
): Record<string, string> {
  const resolved = { ...env };
  // Build reverse map: alias -> canonical
  for (const [alias, canonical] of Object.entries(aliases)) {
    if (alias in resolved && !(canonical in resolved)) {
      resolved[canonical] = resolved[alias];
      delete resolved[alias];
    } else if (alias in resolved && canonical in resolved) {
      // canonical wins; remove the alias key
      delete resolved[alias];
    }
  }
  return resolved;
}

export function applyAliasesToStages(
  stages: Record<string, Record<string, string>>,
  aliases: AliasMap
): Record<string, AliasResult> {
  const results: Record<string, AliasResult> = {};
  for (const [stage, env] of Object.entries(stages)) {
    results[stage] = applyAliases(env, aliases);
  }
  return results;
}

export function formatAliasResult(result: AliasResult, stage?: string): string {
  const lines: string[] = [];
  const header = stage ? `Alias result for [${stage}]` : "Alias result";
  lines.push(header);
  if (result.applied.length > 0) {
    lines.push(`  Applied (${result.applied.length}): ${result.applied.join(", ")}`);
  }
  if (result.skipped.length > 0) {
    lines.push(`  Skipped (${result.skipped.length}): ${result.skipped.join(", ")}`);
  }
  return lines.join("\n");
}
