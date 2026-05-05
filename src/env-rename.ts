/**
 * env-rename.ts
 * Rename keys across one or more env maps with optional pattern support.
 */

export type RenameRule = { from: string; to: string };

export type RenameResult = {
  renamed: Record<string, string>;
  notFound: string[];
  envMap: Record<string, string>;
};

/**
 * Apply a list of rename rules to a single env map.
 * Returns the updated map plus metadata about what was renamed / not found.
 */
export function renameEnvMap(
  envMap: Record<string, string>,
  rules: RenameRule[]
): RenameResult {
  const result: Record<string, string> = { ...envMap };
  const renamed: Record<string, string> = {};
  const notFound: string[] = [];

  for (const rule of rules) {
    if (Object.prototype.hasOwnProperty.call(result, rule.from)) {
      result[rule.to] = result[rule.from];
      delete result[rule.from];
      renamed[rule.from] = rule.to;
    } else {
      notFound.push(rule.from);
    }
  }

  return { renamed, notFound, envMap: result };
}

/**
 * Apply rename rules across multiple stages.
 */
export function renameStages(
  stages: Record<string, Record<string, string>>,
  rules: RenameRule[]
): Record<string, RenameResult> {
  const out: Record<string, RenameResult> = {};
  for (const [stage, envMap] of Object.entries(stages)) {
    out[stage] = renameEnvMap(envMap, rules);
  }
  return out;
}

/**
 * Parse rename rules from CLI-style strings like "OLD_KEY:NEW_KEY".
 */
export function parseRenameRules(raw: string[]): RenameRule[] {
  return raw.map((entry) => {
    const colonIdx = entry.indexOf(":");
    if (colonIdx === -1) {
      throw new Error(
        `Invalid rename rule "${entry}". Expected format OLD_KEY:NEW_KEY`
      );
    }
    return {
      from: entry.slice(0, colonIdx).trim(),
      to: entry.slice(colonIdx + 1).trim(),
    };
  });
}

/**
 * Format a rename result summary for display.
 */
export function formatRenameResult(stage: string, result: RenameResult): string {
  const lines: string[] = [`[${stage}]`];
  for (const [from, to] of Object.entries(result.renamed)) {
    lines.push(`  renamed: ${from} → ${to}`);
  }
  for (const key of result.notFound) {
    lines.push(`  not found: ${key}`);
  }
  if (lines.length === 1) lines.push("  (no changes)");
  return lines.join("\n");
}
