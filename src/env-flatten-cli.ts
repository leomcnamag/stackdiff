import * as fs from "fs";
import * as path from "path";
import { flattenEnvGroups, expandEnvMap, formatFlattenResult, EnvMap } from "./env-flatten";
import { parseEnvFile } from "./parser";

export interface FlattenCliArgs {
  files: string[];
  mode: "flatten" | "expand";
  separator: string;
  output?: string;
}

export function parseFlattenArgs(argv: string[]): FlattenCliArgs {
  const args: FlattenCliArgs = { files: [], mode: "flatten", separator: "__" };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--expand") args.mode = "expand";
    else if (arg === "--separator" || arg === "-s") args.separator = argv[++i] ?? "__";
    else if (arg === "--output" || arg === "-o") args.output = argv[++i];
    else if (!arg.startsWith("-")) args.files.push(arg);
  }
  return args;
}

export function runFlattenCliWithArgs(args: FlattenCliArgs): void {
  if (args.files.length === 0) {
    console.error("No input files provided.");
    process.exit(1);
  }

  if (args.mode === "flatten") {
    const groups: Record<string, EnvMap> = {};
    for (const file of args.files) {
      const stage = path.basename(file, path.extname(file));
      groups[stage] = parseEnvFile(fs.readFileSync(file, "utf8"));
    }
    const result = flattenEnvGroups(groups, args.separator);
    const lines = Object.entries(result.flattened).map(([k, v]) => `${k}=${v}`);
    const out = lines.join("\n") + "\n";
    if (args.output) fs.writeFileSync(args.output, out);
    else process.stdout.write(out);
    console.error(formatFlattenResult(result));
  } else {
    const flat: EnvMap = parseEnvFile(fs.readFileSync(args.files[0], "utf8"));
    const groups = expandEnvMap(flat, args.separator);
    const out = JSON.stringify(groups, null, 2) + "\n";
    if (args.output) fs.writeFileSync(args.output, out);
    else process.stdout.write(out);
  }
}

export function runFlattenCli(): void {
  const args = parseFlattenArgs(process.argv.slice(2));
  runFlattenCliWithArgs(args);
}
