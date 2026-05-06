import * as fs from 'fs';
import { parseEnvFile, stageFromPath } from './parser';
import { copyEnvKeys, CopyOptions, formatCopyResult } from './env-copy';
import { serializeEnv } from './transform-cli';

export interface CopyCliArgs {
  source: string;
  target: string;
  keys?: string[];
  prefix?: string;
  overwrite?: boolean;
  stripPrefix?: boolean;
  output?: string;
  quiet?: boolean;
}

export function parseCopyArgs(argv: string[]): CopyCliArgs {
  const args: CopyCliArgs = { source: '', target: '' };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--source' || arg === '-s') args.source = argv[++i];
    else if (arg === '--target' || arg === '-t') args.target = argv[++i];
    else if (arg === '--keys' || arg === '-k') args.keys = argv[++i].split(',');
    else if (arg === '--prefix' || arg === '-p') args.prefix = argv[++i];
    else if (arg === '--overwrite') args.overwrite = true;
    else if (arg === '--strip-prefix') args.stripPrefix = true;
    else if (arg === '--output' || arg === '-o') args.output = argv[++i];
    else if (arg === '--quiet' || arg === '-q') args.quiet = true;
  }
  return args;
}

export function runCopyCliWithArgs(args: CopyCliArgs): void {
  if (!args.source || !args.target) {
    console.error('Error: --source and --target are required');
    process.exit(1);
  }

  const sourceMap = parseEnvFile(fs.readFileSync(args.source, 'utf-8'));
  const targetMap = fs.existsSync(args.target)
    ? parseEnvFile(fs.readFileSync(args.target, 'utf-8'))
    : {};

  const options: CopyOptions = {
    keys: args.keys,
    prefix: args.prefix,
    overwrite: args.overwrite,
    stripPrefix: args.stripPrefix,
  };

  const result = copyEnvKeys(sourceMap, targetMap, options);

  const outputContent = serializeEnv(result.target);
  const dest = args.output || args.target;
  fs.writeFileSync(dest, outputContent, 'utf-8');

  if (!args.quiet) {
    console.log(formatCopyResult(result));
    console.log(`\nWritten to: ${dest}`);
  }
}

export function runCopyCli(): void {
  runCopyCliWithArgs(parseCopyArgs(process.argv.slice(2)));
}
