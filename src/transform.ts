/**
 * transform.ts — apply key/value transformations to env maps
 */

export type TransformFn = (key: string, value: string) => { key: string; value: string };

export interface TransformRule {
  type: 'prefix' | 'suffix' | 'uppercase' | 'lowercase' | 'rename' | 'replace';
  match?: string;   // key pattern (substring match)
  from?: string;    // for rename/replace
  to?: string;      // for rename/replace
  value?: string;   // for prefix/suffix
}

export function applyRule(rule: TransformRule, key: string, val: string): { key: string; value: string } {
  switch (rule.type) {
    case 'prefix':
      if (!rule.match || key.includes(rule.match)) {
        return { key: (rule.value ?? '') + key, value: val };
      }
      break;
    case 'suffix':
      if (!rule.match || key.includes(rule.match)) {
        return { key: key + (rule.value ?? ''), value: val };
      }
      break;
    case 'uppercase':
      if (!rule.match || key.includes(rule.match)) {
        return { key, value: val.toUpperCase() };
      }
      break;
    case 'lowercase':
      if (!rule.match || key.includes(rule.match)) {
        return { key, value: val.toLowerCase() };
      }
      break;
    case 'rename':
      if (rule.from && key === rule.from) {
        return { key: rule.to ?? key, value: val };
      }
      break;
    case 'replace':
      if (!rule.match || key.includes(rule.match)) {
        return { key, value: val.replaceAll(rule.from ?? '', rule.to ?? '') };
      }
      break;
  }
  return { key, value: val };
}

export function transformEnvMap(
  env: Record<string, string>,
  rules: TransformRule[]
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(env)) {
    let cur = { key: k, value: v };
    for (const rule of rules) {
      cur = applyRule(rule, cur.key, cur.value);
    }
    result[cur.key] = cur.value;
  }
  return result;
}

export function transformStages(
  stages: Record<string, Record<string, string>>,
  rules: TransformRule[]
): Record<string, Record<string, string>> {
  return Object.fromEntries(
    Object.entries(stages).map(([stage, env]) => [stage, transformEnvMap(env, rules)])
  );
}
