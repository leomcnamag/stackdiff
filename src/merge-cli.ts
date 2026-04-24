import * as fs from 'fs';
import * as path from 'path';
import { parseEnvFile } from './parser';
import { mergeEnvMaps, formatMergeResult, MergeOptions } from './merge';

export interface MergeCliOptions {
  leftFile: string;
  rightFile: string;
  strategy?: MergeOptions['strategy'];
  prefix?: string;
  output?: string;
  quiet?: boolean;
}

export function runMergeCli(options: MergeCliOptions): void {
  const leftRaw = fs.readFileSync(path.resolve(options.leftFile), 'utf-8');
  const rightRaw = fs.readFileSync(path.resolve(options.rightFile), 'utf-8');

  const left = parseEnvFile(leftRaw);
  const right = parseEnvFile(rightRaw);

  const mergeOptions: MergeOptions = {
    strategy: options.strategy ?? 'union',
    prefix: options.prefix,
  };

  const result = mergeEnvMaps(left, right, mergeOptions);

  if (!options.quiet) {
    console.log(formatMergeResult(result));
    console.log();
  }

  const lines = Object.entries(result.merged)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`);

  const output = lines.join('\n') + '\n';

  if (options.output) {
    fs.writeFileSync(path.resolve(options.output), output, 'utf-8');
    if (!options.quiet) {
      console.log(`Written to ${options.output}`);
    }
  } else {
    process.stdout.write(output);
  }
}

export function parseMergeArgs(argv: string[]): MergeCliOptions {
  const args = argv.slice(2);
  const opts: MergeCliOptions = { leftFile: '', rightFile: '' };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--strategy': opts.strategy = args[++i] as MergeOptions['strategy']; break;
      case '--prefix':   opts.prefix = args[++i]; break;
      case '--output':   opts.output = args[++i]; break;
      case '--quiet':    opts.quiet = true; break;
      default:
        if (!opts.leftFile) opts.leftFile = args[i];
        else opts.rightFile = args[i];
    }
  }

  if (!opts.leftFile || !opts.rightFile) {
    throw new Error('Usage: stackdiff merge <left-file> <right-file> [--strategy union|left|right|intersection] [--prefix PREFIX] [--output FILE] [--quiet]');
  }

  return opts;
}
