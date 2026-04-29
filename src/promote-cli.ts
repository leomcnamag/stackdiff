import * as fs from 'fs';
import { parseEnvFile } from './parser';
import { promoteEnvMap, formatPromoteResult, PromoteOptions } from './promote';

export interface PromoteCliArgs {
  sourceFile: string;
  targetFile: string;
  overwrite: boolean;
  dryRun: boolean;
  keys?: string[];
  output?: 'text' | 'json';
}

export function parsePromoteArgs(argv: string[]): PromoteCliArgs {
  const args: PromoteCliArgs = {
    sourceFile: '',
    targetFile: '',
    overwrite: false,
    dryRun: false,
    output: 'text',
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--overwrite') {
      args.overwrite = true;
    } else if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--keys' && argv[i + 1]) {
      args.keys = argv[++i].split(',');
    } else if (arg === '--output' && argv[i + 1]) {
      args.output = argv[++i] as 'text' | 'json';
    } else if (!args.sourceFile) {
      args.sourceFile = arg;
    } else if (!args.targetFile) {
      args.targetFile = arg;
    }
  }

  return args;
}

export function runPromoteCli(argv: string[]): void {
  const args = parsePromoteArgs(argv);

  if (!args.sourceFile || !args.targetFile) {
    console.error('Usage: stackdiff promote <source.env> <target.env> [--overwrite] [--dry-run] [--keys KEY1,KEY2] [--output text|json]');
    process.exit(1);
  }

  if (!fs.existsSync(args.sourceFile) || !fs.existsSync(args.targetFile)) {
    console.error('Error: one or both env files not found');
    process.exit(1);
  }

  const sourceMap = parseEnvFile(fs.readFileSync(args.sourceFile, 'utf8'));
  const targetMap = parseEnvFile(fs.readFileSync(args.targetFile, 'utf8'));

  const options: PromoteOptions = {
    overwrite: args.overwrite,
    dryRun: args.dryRun,
    keys: args.keys,
  };

  const result = promoteEnvMap(sourceMap, targetMap, args.sourceFile, args.targetFile, options);

  if (args.output === 'json') {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatPromoteResult(result));
    if (args.dryRun) {
      console.log('\n(dry run — no files written)');
    }
  }
}
