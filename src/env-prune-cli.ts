import * as fs from 'fs';
import { parseEnvFile } from './parser';
import { pruneEnvMap, formatPruneResult, PruneOptions } from './env-prune';

export interface PruneCliArgs {
  inputPath: string;
  outputPath?: string;
  keepKeys?: string[];
  removeKeys?: string[];
  removeEmpty: boolean;
  removeDuplicateValues: boolean;
}

export function parsePruneArgs(argv: string[]): PruneCliArgs {
  const args: PruneCliArgs = { inputPath: '', removeEmpty: false, removeDuplicateValues: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--input' || arg === '-i') args.inputPath = argv[++i];
    else if (arg === '--output' || arg === '-o') args.outputPath = argv[++i];
    else if (arg === '--keep') args.keepKeys = argv[++i].split(',');
    else if (arg === '--remove') args.removeKeys = argv[++i].split(',');
    else if (arg === '--remove-empty') args.removeEmpty = true;
    else if (arg === '--remove-duplicates') args.removeDuplicateValues = true;
    else if (!args.inputPath) args.inputPath = arg;
  }
  return args;
}

export function runPruneCliWithArgs(args: PruneCliArgs): void {
  if (!args.inputPath) {
    console.error('Error: input file path required');
    process.exit(1);
  }

  const raw = fs.readFileSync(args.inputPath, 'utf-8');
  const env = parseEnvFile(raw);

  const options: PruneOptions = {
    keepKeys: args.keepKeys,
    removeKeys: args.removeKeys,
    removeEmpty: args.removeEmpty,
    removeDuplicateValues: args.removeDuplicateValues,
  };

  const result = pruneEnvMap(env, options);
  console.log(formatPruneResult(result));

  if (args.outputPath) {
    const lines = Object.entries(result.pruned).map(([k, v]) => `${k}=${v}`);
    fs.writeFileSync(args.outputPath, lines.join('\n') + '\n', 'utf-8');
    console.log(`\nWritten to ${args.outputPath}`);
  }
}

export function runPruneCli(): void {
  const args = parsePruneArgs(process.argv.slice(2));
  runPruneCliWithArgs(args);
}
