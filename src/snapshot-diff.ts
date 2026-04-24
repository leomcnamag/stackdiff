import { Snapshot } from './snapshot';
import { diffEnvMaps, DiffResult } from './diff';

export interface SnapshotDiffResult {
  from: { stage: string; timestamp: string };
  to: { stage: string; timestamp: string };
  diff: DiffResult;
}

export function diffSnapshots(from: Snapshot, to: Snapshot): SnapshotDiffResult {
  return {
    from: { stage: from.stage, timestamp: from.timestamp },
    to: { stage: to.stage, timestamp: to.timestamp },
    diff: diffEnvMaps(from.vars, to.vars),
  };
}

export function formatSnapshotDiff(result: SnapshotDiffResult): string {
  const lines: string[] = [];
  lines.push(`Snapshot diff: ${result.from.stage}@${result.from.timestamp} → ${result.to.stage}@${result.to.timestamp}`);
  lines.push('');

  const { added, removed, changed, unchanged } = result.diff;

  if (added.length > 0) {
    lines.push('Added:');
    added.forEach(k => lines.push(`  + ${k}`));
  }

  if (removed.length > 0) {
    lines.push('Removed:');
    removed.forEach(k => lines.push(`  - ${k}`));
  }

  if (changed.length > 0) {
    lines.push('Changed:');
    changed.forEach(({ key, from, to }) => lines.push(`  ~ ${key}: ${from} → ${to}`));
  }

  if (added.length === 0 && removed.length === 0 && changed.length === 0) {
    lines.push('No differences found.');
  }

  lines.push('');
  lines.push(`Unchanged: ${unchanged.length} variable(s)`);

  return lines.join('\n');
}
