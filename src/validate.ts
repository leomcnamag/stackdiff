import { EnvMap } from './parser';

export interface ValidationRule {
  key: string;
  required?: boolean;
  pattern?: RegExp;
  allowedValues?: string[];
}

export interface ValidationResult {
  stage: string;
  errors: string[];
  warnings: string[];
  valid: boolean;
}

export interface ValidationReport {
  results: ValidationResult[];
  totalErrors: number;
  totalWarnings: number;
  allValid: boolean;
}

export function validateEnvMap(
  stage: string,
  env: EnvMap,
  rules: ValidationRule[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const rule of rules) {
    const value = env[rule.key];

    if (rule.required && (value === undefined || value === '')) {
      errors.push(`Missing required key: ${rule.key}`);
      continue;
    }

    if (value === undefined) continue;

    if (rule.pattern && !rule.pattern.test(value)) {
      errors.push(`Key "${rule.key}" value "${value}" does not match pattern ${rule.pattern}`);
    }

    if (rule.allowedValues && !rule.allowedValues.includes(value)) {
      warnings.push(
        `Key "${rule.key}" value "${value}" not in allowed values: [${rule.allowedValues.join(', ')}]`
      );
    }
  }

  return { stage, errors, warnings, valid: errors.length === 0 };
}

export function validateStages(
  stages: Record<string, EnvMap>,
  rules: ValidationRule[]
): ValidationReport {
  const results = Object.entries(stages).map(([stage, env]) =>
    validateEnvMap(stage, env, rules)
  );

  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

  return {
    results,
    totalErrors,
    totalWarnings,
    allValid: results.every((r) => r.valid),
  };
}

export function formatValidationReport(report: ValidationReport): string {
  const lines: string[] = [];
  for (const result of report.results) {
    const status = result.valid ? '✓' : '✗';
    lines.push(`[${status}] ${result.stage}`);
    for (const err of result.errors) lines.push(`    ERROR: ${err}`);
    for (const warn of result.warnings) lines.push(`    WARN:  ${warn}`);
  }
  lines.push('');
  lines.push(`Total: ${report.totalErrors} error(s), ${report.totalWarnings} warning(s)`);
  return lines.join('\n');
}
