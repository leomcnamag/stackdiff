import { EnvMap } from './parser';

export interface LintRule {
  name: string;
  check: (key: string, value: string) => string | null;
}

export interface LintResult {
  key: string;
  rule: string;
  message: string;
}

export interface LintReport {
  stage: string;
  results: LintResult[];
  passed: boolean;
}

export const defaultRules: LintRule[] = [
  {
    name: 'no-empty-value',
    check: (key, value) =>
      value.trim() === '' ? `Key "${key}" has an empty value` : null,
  },
  {
    name: 'no-whitespace-key',
    check: (key) =>
      /\s/.test(key) ? `Key "${key}" contains whitespace` : null,
  },
  {
    name: 'uppercase-key',
    check: (key) =>
      key !== key.toUpperCase()
        ? `Key "${key}" should be uppercase (found mixed case)`
        : null,
  },
  {
    name: 'no-quotes-in-value',
    check: (key, value) =>
      /^["'].*["']$/.test(value)
        ? `Key "${key}" value appears to be wrapped in quotes`
        : null,
  },
];

export function lintEnvMap(
  stage: string,
  envMap: EnvMap,
  rules: LintRule[] = defaultRules
): LintReport {
  const results: LintResult[] = [];

  for (const [key, value] of Object.entries(envMap)) {
    for (const rule of rules) {
      const message = rule.check(key, value);
      if (message) {
        results.push({ key, rule: rule.name, message });
      }
    }
  }

  return { stage, results, passed: results.length === 0 };
}

export function formatLintReport(report: LintReport): string {
  if (report.passed) {
    return `✔ ${report.stage}: no lint issues found`;
  }

  const lines = [`✘ ${report.stage}: ${report.results.length} issue(s) found`];
  for (const result of report.results) {
    lines.push(`  [${result.rule}] ${result.message}`);
  }
  return lines.join('\n');
}

export function lintStages(
  stages: Record<string, EnvMap>,
  rules: LintRule[] = defaultRules
): LintReport[] {
  return Object.entries(stages).map(([stage, envMap]) =>
    lintEnvMap(stage, envMap, rules)
  );
}
