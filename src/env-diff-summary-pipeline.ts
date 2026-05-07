import { EnvMap } from './parser';
import { buildDiffSummary, DiffSummary } from './env-diff-summary';

export interface StagePair {
  fromStage: string;
  toStage: string;
}

export interface PipelineDiffResult {
  pairs: StagePair[];
  summaries: DiffSummary[];
  totalAdded: number;
  totalRemoved: number;
  totalChanged: number;
}

export function diffStagePairs(
  stages: Record<string, EnvMap>,
  pairs: StagePair[]
): PipelineDiffResult {
  const summaries: DiffSummary[] = [];

  for (const pair of pairs) {
    const fromMap = stages[pair.fromStage] ?? {};
    const toMap = stages[pair.toStage] ?? {};
    summaries.push(buildDiffSummary(pair.fromStage, fromMap, pair.toStage, toMap));
  }

  return {
    pairs,
    summaries,
    totalAdded: summaries.reduce((s, d) => s + d.addedCount, 0),
    totalRemoved: summaries.reduce((s, d) => s + d.removedCount, 0),
    totalChanged: summaries.reduce((s, d) => s + d.changedCount, 0),
  };
}

export function inferPairs(stageNames: string[]): StagePair[] {
  const pairs: StagePair[] = [];
  for (let i = 0; i < stageNames.length - 1; i++) {
    pairs.push({ fromStage: stageNames[i], toStage: stageNames[i + 1] });
  }
  return pairs;
}

export function formatPipelineDiffResult(result: PipelineDiffResult): string {
  const lines: string[] = [
    `Pipeline Diff Summary (${result.summaries.length} pair(s))`,
    `  Total: +${result.totalAdded} added  -${result.totalRemoved} removed  ~${result.totalChanged} changed`,
    '',
  ];

  for (const summary of result.summaries) {
    lines.push(
      `  ${summary.fromStage} → ${summary.toStage}: ` +
      `+${summary.addedCount} -${summary.removedCount} ~${summary.changedCount}`
    );
  }

  return lines.join('\n');
}
