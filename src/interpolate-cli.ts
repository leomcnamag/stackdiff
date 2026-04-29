/**
 * interpolate-cli.ts
 * CLI integration for the interpolate feature.
 * Reads a stage env map, resolves variable references, and prints results.
 */

import { parseEnvFiles } from "./parser";
import { interpolateStages } from "./interpolate";

export interface InterpolateCliArgs {
  files: string[];
  keepUnresolved: boolean;
  outputJson: boolean;
}

export function parseInterpolateArgs(argv: string[]): InterpolateCliArgs {
  const files: string[] = [];
  let keepUnresolved = false;
  let outputJson = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--keep-unresolved") {
      keepUnresolved = true;
    } else if (arg === "--json") {
      outputJson = true;
    } else if (!arg.startsWith("--")) {
      files.push(arg);
    }
  }

  return { files, keepUnresolved, outputJson };
}

export async function runInterpolateCli(
  argv: string[],
  write: (s: string) => void = console.log
): Promise<void> {
  const { files, keepUnresolved, outputJson } = parseInterpolateArgs(argv);

  if (files.length === 0) {
    write("Usage: stackdiff interpolate <file...> [--keep-unresolved] [--json]");
    return;
  }

  const stages = parseEnvFiles(files);
  const resolved = interpolateStages(stages, { keepUnresolved });

  if (outputJson) {
    write(JSON.stringify(resolved, null, 2));
    return;
  }

  for (const [stage, env] of Object.entries(resolved)) {
    write(`\n[${stage}]`);
    for (const [key, value] of Object.entries(env)) {
      write(`  ${key}=${value}`);
    }
  }
}
