/**
 * transform-pipeline.ts — compose and run ordered transform pipelines
 */

import { TransformRule, transformEnvMap } from './transform';

export interface Pipeline {
  name: string;
  rules: TransformRule[];
}

export function createPipeline(name: string, rules: TransformRule[]): Pipeline {
  return { name, rules };
}

export function runPipeline(
  env: Record<string, string>,
  pipeline: Pipeline
): Record<string, string> {
  return transformEnvMap(env, pipeline.rules);
}

export function composePipelines(
  env: Record<string, string>,
  pipelines: Pipeline[]
): Record<string, string> {
  return pipelines.reduce((acc, p) => runPipeline(acc, p), env);
}

export function pipelineFromJson(json: unknown): Pipeline {
  if (typeof json !== 'object' || json === null) throw new Error('Invalid pipeline JSON');
  const obj = json as Record<string, unknown>;
  if (typeof obj['name'] !== 'string') throw new Error('Pipeline must have a string name');
  if (!Array.isArray(obj['rules'])) throw new Error('Pipeline must have a rules array');
  return { name: obj['name'], rules: obj['rules'] as TransformRule[] };
}

export function formatPipelineSummary(pipeline: Pipeline, before: Record<string, string>, after: Record<string, string>): string {
  const changed = Object.keys(after).filter(
    k => !before[k] || before[k] !== after[k]
  ).length;
  const added = Object.keys(after).filter(k => !(k in before)).length;
  const removed = Object.keys(before).filter(k => !(k in after)).length;
  return [
    `Pipeline: ${pipeline.name}`,
    `  Rules applied : ${pipeline.rules.length}`,
    `  Keys changed  : ${changed}`,
    `  Keys added    : ${added}`,
    `  Keys removed  : ${removed}`,
  ].join('\n');
}
