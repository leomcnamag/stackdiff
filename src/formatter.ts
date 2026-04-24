import chalk from 'chalk';
import { DiffResult, StageDiff } from './diff';

export type OutputFormat = 'table' | 'json' | 'minimal';

export function formatDiff(stageDiff: StageDiff, format: OutputFormat = 'table'): string {
  switch (format) {
    case 'json':
      return formatJson(stageDiff);
    case 'minimal':
      return formatMinimal(stageDiff);
    case 'table':
    default:
      return formatTable(stageDiff);
  }
}

function formatTable(stageDiff: StageDiff): string {
  const lines: string[] = [];
  const { stageA, stageB, diffs } = stageDiff;

  lines.push(chalk.bold(`\n  Diff: ${chalk.cyan(stageA)} → ${chalk.cyan(stageB)}\n`));

  if (diffs.length === 0) {
    lines.push(chalk.green('  ✓ No differences found.\n'));
    return lines.join('\n');
  }

  const colWidth = Math.max(20, ...diffs.map(d => d.key.length)) + 2;

  lines.push(
    chalk.bold(
      `  ${'KEY'.padEnd(colWidth)}${'STATUS'.padEnd(12)}${'VALUE (A)'.padEnd(30)}VALUE (B)`
    )
  );
  lines.push('  ' + '─'.repeat(colWidth + 52));

  for (const diff of diffs) {
    const key = diff.key.padEnd(colWidth);
    const valA = truncate(diff.valueA ?? chalk.dim('(missing)'), 28);
    const valB = truncate(diff.valueB ?? chalk.dim('(missing)'), 28);

    if (diff.status === 'added') {
      lines.push(chalk.green(`  ${key}${'added'.padEnd(12)}${valA.padEnd(30)}${valB}`));
    } else if (diff.status === 'removed') {
      lines.push(chalk.red(`  ${key}${'removed'.padEnd(12)}${valA.padEnd(30)}${valB}`));
    } else {
      lines.push(chalk.yellow(`  ${key}${'changed'.padEnd(12)}${valA.padEnd(30)}${valB}`));
    }
  }

  lines.push('');
  return lines.join('\n');
}

function formatMinimal(stageDiff: StageDiff): string {
  const { stageA, stageB, diffs } = stageDiff;
  if (diffs.length === 0) return `${stageA}→${stageB}: no differences`;
  return diffs
    .map(d => `${d.status.toUpperCase()} ${d.key} [${stageA}→${stageB}]`)
    .join('\n');
}

function formatJson(stageDiff: StageDiff): string {
  return JSON.stringify(stageDiff, null, 2);
}

function truncate(value: string, maxLen: number): string {
  return value.length > maxLen ? value.slice(0, maxLen - 1) + '…' : value;
}
