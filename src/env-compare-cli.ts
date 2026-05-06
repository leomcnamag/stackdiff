import * as fs from 'fs';
import { parseEnvFile } from './parser';
import { compareStages, formatCompareReport } from './env-compare';

export interface CompareCliArgs {
  files: string[];
  filter?: 'inconsistent' | 'missing' | 'consistent';
  json: boolean;
}

export function parseCompareArgs(argv: string[]): CompareCliArgs {
  const args = argv.slice(2);
  const files: string[] = [];
  let filter: CompareCliArgs['filter'];
  let json = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--filter' && args[i + 1]) {
      filter = args[++i] as CompareCliArgs['filter'];
    } else if (args[i] === '--json') {
      json = true;
    } else {
      files.push(args[i]);
    }
  }

  return { files, filter, json };
}

export function runCompareCliWithArgs(args: CompareCliArgs): void {
  if (args.files.length < 2) {
    console.error('Usage: stackdiff compare <file1> <file2> [...files]');
    process.exit(1);
  }

  const stages: Record<string, Record<string, string>> = {};
  for (const file of args.files) {
    if (!fs.existsSync(file)) {
      console.error(`File not found: ${file}`);
      process.exit(1);
    }
    const name = file.replace(/.*\.env\.?/, '') || file;
    stages[name] = parseEnvFile(fs.readFileSync(file, 'utf8'));
  }

  let report = compareStages(stages);

  if (args.filter) {
    report = {
      ...report,
      results: report.results.filter((r) => r.status === args.filter),
    };
  }

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatCompareReport(report, Object.keys(stages)));
  }
}

export function runCompareCli(): void {
  runCompareCliWithArgs(parseCompareArgs(process.argv));
}
