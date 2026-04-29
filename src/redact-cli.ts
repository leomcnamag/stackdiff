/**
 * CLI handler for the redact subcommand.
 */

import { parseEnvFiles } from "./parser";
import { redactStages, RedactOptions } from "./redact";
import { formatTable } from "./formatter";
import { diffStages } from "./diff";

export interface RedactCliArgs {
  files: string[];
  replacement?: string;
  showLength?: boolean;
  customPatterns?: string[];
  output?: "table" | "json";
}

export function parseRedactArgs(argv: string[]): RedactCliArgs {
  const args: RedactCliArgs = { files: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--replacement" && argv[i + 1]) {
      args.replacement = argv[++i];
    } else if (arg === "--show-length") {
      args.showLength = true;
    } else if (arg === "--pattern" && argv[i + 1]) {
      args.customPatterns = args.customPatterns ?? [];
      args.customPatterns.push(argv[++i]);
    } else if (arg === "--output" && argv[i + 1]) {
      args.output = argv[++i] as "table" | "json";
    } else if (!arg.startsWith("--")) {
      args.files.push(arg);
    }
  }
  return args;
}

export async function runRedactCli(argv: string[]): Promise<void> {
  const args = parseRedactArgs(argv);

  if (args.files.length === 0) {
    console.error("Usage: stackdiff redact <file...> [options]");
    process.exit(1);
  }

  const stages = parseEnvFiles(args.files);

  const options: RedactOptions = {
    replacement: args.replacement,
    showLength: args.showLength,
    patterns: args.customPatterns?.map((p) => new RegExp(p, "i")),
  };

  const redacted = redactStages(stages, options);

  if (args.output === "json") {
    console.log(JSON.stringify(redacted, null, 2));
    return;
  }

  const diff = diffStages(redacted);
  console.log(formatTable(diff));
}
