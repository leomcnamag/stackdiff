import { DiffResult } from './diff';
import { formatJson } from './formatter';
import * as fs from 'fs';
import * as path from 'path';

export type ExportFormat = 'json' | 'csv' | 'markdown';

export function exportToJson(diffs: DiffResult[], outputPath: string): void {
  const content = formatJson(diffs);
  fs.writeFileSync(outputPath, content, 'utf-8');
}

export function exportToCsv(diffs: DiffResult[], outputPath: string): void {
  const rows: string[] = ['stage,key,status,baseValue,targetValue'];
  for (const diff of diffs) {
    for (const entry of diff.entries) {
      const base = entry.baseValue !== undefined ? `"${entry.baseValue}"` : '';
      const target = entry.targetValue !== undefined ? `"${entry.targetValue}"` : '';
      rows.push(`${diff.stage},${entry.key},${entry.status},${base},${target}`);
    }
  }
  fs.writeFileSync(outputPath, rows.join('\n'), 'utf-8');
}

export function exportToMarkdown(diffs: DiffResult[], outputPath: string): void {
  const lines: string[] = ['# StackDiff Report', ''];
  for (const diff of diffs) {
    lines.push(`## Stage: ${diff.stage}`, '');
    lines.push('| Key | Status | Base Value | Target Value |');
    lines.push('|-----|--------|------------|--------------|');
    for (const entry of diff.entries) {
      const base = entry.baseValue ?? '-';
      const target = entry.targetValue ?? '-';
      lines.push(`| ${entry.key} | ${entry.status} | ${base} | ${target} |`);
    }
    lines.push('');
  }
  fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8');
}

export function exportDiff(
  diffs: DiffResult[],
  outputPath: string,
  format: ExportFormat = 'json'
): void {
  const dir = path.dirname(outputPath);
  if (dir && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  switch (format) {
    case 'json':
      exportToJson(diffs, outputPath);
      break;
    case 'csv':
      exportToCsv(diffs, outputPath);
      break;
    case 'markdown':
      exportToMarkdown(diffs, outputPath);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}
