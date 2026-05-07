import * as fs from 'fs';
import * as path from 'path';
import { parseEnvFile } from './parser';
import { buildDiffSummary, formatDiffSummary } from './env-diff-summary';

export interface DiffSummaryCliArgs {
  fromFile: string;
  toFile: string;
  showUnchanged: boolean;
  outputJson: boolean;
}

export function parseDiffSummaryArgs(argv: string[]): DiffSummaryCliArgs {
  const args = argv.slice(2);
  const fromFile = args[0] ?? '';
  const toFile = args[1] ?? '';
  const showUnchanged = args.includes('--show-unchanged');
  const outputJson = args.includes('--json');
  return { fromFile, toFile, showUnchanged, outputJson };
}

export function runDiffSummaryCliWithArgs(args: DiffSummaryCliArgs, write = console.log): void {
  if (!args.fromFile || !args.toFile) {
    write('Usage: stackdiff-diff-summary <from-file> <to-file> [--show-unchanged] [--json]');
    return;
  }

  if (!fs.existsSync(args.fromFile)) {
    write(`Error: file not found: ${args.fromFile}`);
    return;
  }
  if (!fs.existsSync(args.toFile)) {
    write(`Error: file not found: ${args.toFile}`);
    return;
  }

  const fromName = path.basename(args.fromFile, path.extname(args.fromFile));
  const toName = path.basename(args.toFile, path.extname(args.toFile));

  const fromContent = fs.readFileSync(args.fromFile, 'utf-8');
  const toContent = fs.readFileSync(args.toFile, 'utf-8');

  const fromMap = parseEnvFile(fromContent);
  const toMap = parseEnvFile(toContent);

  const summary = buildDiffSummary(fromName, fromMap, toName, toMap);

  if (args.outputJson) {
    write(JSON.stringify(summary, null, 2));
  } else {
    write(formatDiffSummary(summary, args.showUnchanged));
  }
}

export function runDiffSummaryCli(): void {
  runDiffSummaryCliWithArgs(parseDiffSummaryArgs(process.argv));
}
