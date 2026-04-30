import { EnvMap } from './parser';

export interface TemplateResult {
  rendered: EnvMap;
  missing: string[];
  substitutions: number;
}

/**
 * Finds all {{VAR}} placeholders in a template string.
 */
export function findPlaceholders(template: string): string[] {
  const regex = /\{\{([A-Z0-9_]+)\}\}/g;
  const found: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(template)) !== null) {
    if (!found.includes(match[1])) found.push(match[1]);
  }
  return found;
}

/**
 * Renders a single template string by substituting {{VAR}} placeholders
 * from the provided context map.
 */
export function renderTemplate(template: string, context: EnvMap): { value: string; missing: string[] } {
  const missing: string[] = [];
  const value = template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, key) => {
    if (key in context) return context[key];
    missing.push(key);
    return `{{${key}}}`;
  });
  return { value, missing };
}

/**
 * Applies template rendering across an entire EnvMap, using the same map
 * as context (self-referential) plus an optional external context.
 */
export function renderEnvTemplate(template: EnvMap, context: EnvMap = {}): TemplateResult {
  const merged = { ...template, ...context };
  const rendered: EnvMap = {};
  const allMissing: string[] = [];
  let substitutions = 0;

  for (const [key, val] of Object.entries(template)) {
    const { value, missing } = renderTemplate(val, merged);
    rendered[key] = value;
    for (const m of missing) {
      if (!allMissing.includes(m)) allMissing.push(m);
    }
    if (value !== val) substitutions++;
  }

  return { rendered, missing: allMissing, substitutions };
}

/**
 * Renders templates across multiple stages.
 */
export function renderStageTemplates(
  stages: Record<string, EnvMap>,
  sharedContext: EnvMap = {}
): Record<string, TemplateResult> {
  const results: Record<string, TemplateResult> = {};
  for (const [stage, envMap] of Object.entries(stages)) {
    results[stage] = renderEnvTemplate(envMap, sharedContext);
  }
  return results;
}
