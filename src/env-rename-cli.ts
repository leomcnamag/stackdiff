import * as fs from 'fs';
import * as path from 'path';
import { parseEnvFile } from './parser';
import { parseRenameRules, renameEnvMap, formatRenameResult } from './env-rename';

export interface RenameArgs {
  inputFile: string;
  rules: string[];
  outputFile?: string;
  dryRun: boolean;
  quiet: boolean;
}

export function parseRenameCliArgs(argv: string[]): RenameArgs {
  const args: RenameArgs = {
    inputFile: '',
    rules: [],
    outputFile: undefined,
    dryRun: false,
    quiet: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--input' || arg === '-i') {
      args.inputFile = argv[++i];
    } else if (arg === '--rule' || arg === '-r') {
      args.rules.push(argv[++i]);
    } else if (arg === '--output' || arg === '-o') {
      args.outputFile = argv[++i];
    } else if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--quiet' || arg === '-q') {
      args.quiet = true;
    }
  }

  return args;
}

export function runRenameCliWithArgs(args: RenameArgs): string {
  if (!args.inputFile) {
    throw new Error('--input file is required');
  }
  if (args.rules.length === 0) {
    throw new Error('At least one --rule is required (e.g. OLD_KEY=NEW_KEY)');
  }

  const raw = fs.readFileSync(args.inputFile, 'utf-8');
  const envMap = parseEnvFile(raw);
  const renameRules = parseRenameRules(args.rules);
  const result = renameEnvMap(envMap, renameRules);

  if (!args.dryRun && args.outputFile) {
    const lines = Object.entries(result.renamed)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');
    fs.writeFileSync(args.outputFile, lines + '\n', 'utf-8');
  }

  return args.quiet ? '' : formatRenameResult(result);
}

export function runRenameCli(): void {
  const args = parseRenameCliArgs(process.argv.slice(2));
  try {
    const output = runRenameCliWithArgs(args);
    if (output) console.log(output);
  } catch (err: any) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}
