#!/usr/bin/env node
import { Command } from 'commander';
import * as path from 'path';
import { parseEnvFiles } from './parser';
import { diffStages } from './diff';
import { formatDiff, formatTable, formatMinimal, formatJson } from './formatter';

const program = new Command();

program
  .name('stackdiff')
  .description('Visualize and compare environment variable differences across deployment stages')
  .version('1.0.0');

program
  .command('compare <files...>')
  .description('Compare environment variable files across stages')
  .option('-f, --format <format>', 'Output format: table | minimal | json | diff', 'table')
  .option('-s, --stages <stages>', 'Comma-separated list of stage names to compare (overrides auto-detection)')
  .option('--missing', 'Highlight missing keys across stages', false)
  .action((files: string[], options: { format: string; stages?: string; missing: boolean }) => {
    const resolvedFiles = files.map((f) => path.resolve(process.cwd(), f));

    let stageOverrides: string[] | undefined;
    if (options.stages) {
      stageOverrides = options.stages.split(',').map((s) => s.trim());
      if (stageOverrides.length !== resolvedFiles.length) {
        console.error('Error: number of stage names must match number of files');
        process.exit(1);
      }
    }

    try {
      const envMaps = parseEnvFiles(resolvedFiles, stageOverrides);
      const diffs = diffStages(envMaps);

      if (diffs.length === 0) {
        console.log('No differences found across stages.');
        return;
      }

      let output: string;
      switch (options.format) {
        case 'json':
          output = formatJson(diffs);
          break;
        case 'minimal':
          output = formatMinimal(diffs);
          break;
        case 'diff':
          output = formatDiff(diffs);
          break;
        case 'table':
        default:
          output = formatTable(diffs);
          break;
      }

      console.log(output);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
