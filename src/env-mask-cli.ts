import * as fs from 'fs';
import * as path from 'path';
import { parseEnvFile } from './parser';
import { maskEnvMap, MaskMode, MaskOptions, formatMaskSummary } from './env-mask';

export interface MaskCliArgs {
  files: string[];
  keys: string[];
  mode: MaskMode;
  char: string;
  visibleChars: number;
  output?: string;
  summary: boolean;
}

export function parseMaskArgs(argv: string[]): MaskCliArgs {
  const args: MaskCliArgs = {
    files: [],
    keys: [],
    mode: 'partial',
    char: '*',
    visibleChars: 4,
    summary: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--keys' || arg === '-k') {
      args.keys = argv[++i].split(',');
    } else if (arg === '--mode' || arg === '-m') {
      args.mode = argv[++i] as MaskMode;
    } else if (arg === '--char') {
      args.char = argv[++i];
    } else if (arg === '--visible') {
      args.visibleChars = parseInt(argv[++i], 10);
    } else if (arg === '--output' || arg === '-o') {
      args.output = argv[++i];
    } else if (arg === '--summary' || arg === '-s') {
      args.summary = true;
    } else if (!arg.startsWith('--')) {
      args.files.push(arg);
    }
  }

  return args;
}

export function runMaskCliWithArgs(args: MaskCliArgs): void {
  if (args.files.length === 0) {
    console.error('No input files specified.');
    process.exit(1);
  }

  if (args.keys.length === 0) {
    console.error('No keys specified. Use --keys KEY1,KEY2');
    process.exit(1);
  }

  const opts: MaskOptions = {
    mode: args.mode,
    char: args.char,
    visibleChars: args.visibleChars,
  };

  for (const file of args.files) {
    const env = parseEnvFile(fs.readFileSync(file, 'utf-8'));
    const masked = maskEnvMap(env, args.keys, opts);

    const lines = Object.entries(masked)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    if (args.output) {
      const outPath = args.files.length > 1
        ? path.join(args.output, path.basename(file))
        : args.output;
      fs.writeFileSync(outPath, lines + '\n');
    } else {
      console.log(lines);
    }

    if (args.summary) {
      console.error(formatMaskSummary(env, masked));
    }
  }
}

export function runMaskCli(): void {
  runMaskCliWithArgs(parseMaskArgs(process.argv.slice(2)));
}
