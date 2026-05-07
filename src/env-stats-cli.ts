import * as fs from 'fs';
import { parseEnvFile } from './parser';
import { computeEnvStats, formatEnvStats, compareEnvStats } from './env-stats';

export interface StatsCliArgs {
  files: string[];
  compare: boolean;
}

export function parseStatsArgs(argv: string[]): StatsCliArgs {
  const files: string[] = [];
  let compare = false;
  for (const arg of argv) {
    if (arg === '--compare' || arg === '-c') {
      compare = true;
    } else if (!arg.startsWith('-')) {
      files.push(arg);
    }
  }
  return { files, compare };
}

export function runStatsCliWithArgs(args: StatsCliArgs, log = console.log): void {
  if (args.files.length === 0) {
    log('Usage: stackdiff stats <file1> [file2] [--compare]');
    return;
  }

  const loaded = args.files.map(f => {
    if (!fs.existsSync(f)) throw new Error(`File not found: ${f}`);
    const content = fs.readFileSync(f, 'utf-8');
    const env = parseEnvFile(content);
    const stage = f.replace(/.*\//, '').replace(/\.env\.?/, '') || f;
    return { stage, env };
  });

  if (args.compare && loaded.length >= 2) {
    const a = computeEnvStats(loaded[0].env);
    const b = computeEnvStats(loaded[1].env);
    log(compareEnvStats(a, b, loaded[0].stage, loaded[1].stage));
    return;
  }

  for (const { stage, env } of loaded) {
    const stats = computeEnvStats(env);
    log(formatEnvStats(stats, stage));
    log('');
  }
}

export function runStatsCli(): void {
  const args = parseStatsArgs(process.argv.slice(2));
  runStatsCliWithArgs(args);
}
