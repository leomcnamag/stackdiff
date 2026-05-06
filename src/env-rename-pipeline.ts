import { parseRenameRules, renameEnvMap, RenameResult } from './env-rename';
import { EnvMap } from './parser';

export interface RenameStep {
  rules: string[];
  description?: string;
}

export interface Renamepipeline {
  steps: RenameStep[];
}

export interface PipelineRenameResult {
  initial: EnvMap;
  final: EnvMap;
  steps: Array<{ description: string; result: RenameResult }>;
  totalRenamed: number;
  totalSkipped: number;
}

export function runRenamePipeline(
  envMap: EnvMap,
  pipeline: RenameStep[]
): PipelineRenameResult {
  let current: EnvMap = { ...envMap };
  const stepResults: PipelineRenameResult['steps'] = [];
  let totalRenamed = 0;
  let totalSkipped = 0;

  for (const step of pipeline) {
    const rules = parseRenameRules(step.rules);
    const result = renameEnvMap(current, rules);
    stepResults.push({
      description: step.description ?? step.rules.join(', '),
      result,
    });
    totalRenamed += result.renamedKeys.length;
    totalSkipped += result.skippedKeys.length;
    current = result.renamed;
  }

  return {
    initial: envMap,
    final: current,
    steps: stepResults,
    totalRenamed,
    totalSkipped,
  };
}

export function formatPipelineRenameResult(result: PipelineRenameResult): string {
  const lines: string[] = [];
  lines.push(`Rename Pipeline: ${result.steps.length} step(s)`);
  lines.push(`  Total renamed : ${result.totalRenamed}`);
  lines.push(`  Total skipped : ${result.totalSkipped}`);
  lines.push('');

  result.steps.forEach((step, idx) => {
    lines.push(`Step ${idx + 1}: ${step.description}`);
    if (step.result.renamedKeys.length > 0) {
      step.result.renamedKeys.forEach(({ from, to }) => {
        lines.push(`  renamed: ${from} -> ${to}`);
      });
    } else {
      lines.push('  (no keys renamed)');
    }
  });

  return lines.join('\n');
}

export function renamePipelineFromJson(json: unknown): RenameStep[] {
  if (!Array.isArray(json)) {
    throw new Error('Rename pipeline must be a JSON array of steps');
  }
  return json.map((item: any, idx: number) => {
    if (!Array.isArray(item.rules)) {
      throw new Error(`Step ${idx + 1} must have a "rules" array`);
    }
    return {
      rules: item.rules as string[],
      description: item.description as string | undefined,
    };
  });
}
