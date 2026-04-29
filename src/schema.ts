/**
 * Schema validation: enforce required keys and type hints for env stages.
 */

export interface SchemaField {
  required: boolean;
  description?: string;
  pattern?: string; // regex pattern the value must match
}

export type EnvSchema = Record<string, SchemaField>;

export interface SchemaViolation {
  stage: string;
  key: string;
  kind: 'missing_required' | 'pattern_mismatch';
  message: string;
}

export interface SchemaResult {
  valid: boolean;
  violations: SchemaViolation[];
}

export function validateAgainstSchema(
  stages: Record<string, Record<string, string>>,
  schema: EnvSchema
): SchemaResult {
  const violations: SchemaViolation[] = [];

  for (const [stage, envMap] of Object.entries(stages)) {
    for (const [key, field] of Object.entries(schema)) {
      if (field.required && !(key in envMap)) {
        violations.push({
          stage,
          key,
          kind: 'missing_required',
          message: `Required key "${key}" is missing in stage "${stage}"`,
        });
        continue;
      }

      if (field.pattern && key in envMap) {
        const regex = new RegExp(field.pattern);
        if (!regex.test(envMap[key])) {
          violations.push({
            stage,
            key,
            kind: 'pattern_mismatch',
            message: `Key "${key}" in stage "${stage}" does not match pattern /${field.pattern}/`,
          });
        }
      }
    }
  }

  return { valid: violations.length === 0, violations };
}

export function formatSchemaResult(result: SchemaResult): string {
  if (result.valid) return '✔ All stages conform to schema.\n';
  const lines = ['✘ Schema violations found:\n'];
  for (const v of result.violations) {
    lines.push(`  [${v.stage}] ${v.kind}: ${v.message}`);
  }
  return lines.join('\n') + '\n';
}
