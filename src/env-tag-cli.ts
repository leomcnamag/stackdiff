import fs from "fs";
import { loadTagMap } from "./env-tag-loader";
import { tagEnvMap, filterByTag, formatTagSummary } from "./env-tag";
import { parseEnvFile } from "./parser";

export interface TagCliArgs {
  envFile: string;
  tagFile: string;
  filter?: string;
  json?: boolean;
}

export function parseTagArgs(argv: string[]): TagCliArgs {
  const args: TagCliArgs = { envFile: "", tagFile: "" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--env" && argv[i + 1]) args.envFile = argv[++i];
    else if (argv[i] === "--tags" && argv[i + 1]) args.tagFile = argv[++i];
    else if (argv[i] === "--filter" && argv[i + 1]) args.filter = argv[++i];
    else if (argv[i] === "--json") args.json = true;
  }
  if (!args.envFile || !args.tagFile) {
    throw new Error("Usage: env-tag --env <file> --tags <tagfile> [--filter <tag>] [--json]");
  }
  return args;
}

export function runTagCliWithArgs(args: TagCliArgs): string {
  const raw = fs.readFileSync(args.envFile, "utf-8");
  const env = parseEnvFile(raw);
  const tagMap = loadTagMap(args.tagFile);

  if (args.filter) {
    const filtered = filterByTag(env, tagMap, args.filter);
    if (args.json) return JSON.stringify(filtered, null, 2);
    return Object.entries(filtered)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");
  }

  const summary = tagEnvMap(env, tagMap);
  if (args.json) return JSON.stringify(summary, null, 2);
  return formatTagSummary(summary);
}

export function runTagCli(argv = process.argv.slice(2)): void {
  try {
    const args = parseTagArgs(argv);
    console.log(runTagCliWithArgs(args));
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}
