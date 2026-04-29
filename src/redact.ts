/**
 * Redact sensitive environment variable values for safe display/export.
 */

export interface RedactOptions {
  patterns?: RegExp[];
  replacement?: string;
  showLength?: boolean;
}

const DEFAULT_SENSITIVE_PATTERNS: RegExp[] = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /private[_-]?key/i,
  /auth/i,
  /credential/i,
  /passphrase/i,
];

export function isSensitiveKey(key: string, patterns?: RegExp[]): boolean {
  const checks = patterns ?? DEFAULT_SENSITIVE_PATTERNS;
  return checks.some((p) => p.test(key));
}

export function redactValue(
  value: string,
  replacement = "***",
  showLength = false
): string {
  if (showLength) {
    return `${replacement}(${value.length})`;
  }
  return replacement;
}

export function redactEnvMap(
  env: Record<string, string>,
  options: RedactOptions = {}
): Record<string, string> {
  const { patterns, replacement = "***", showLength = false } = options;
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    result[key] = isSensitiveKey(key, patterns)
      ? redactValue(value, replacement, showLength)
      : value;
  }
  return result;
}

export function redactStages(
  stages: Record<string, Record<string, string>>,
  options: RedactOptions = {}
): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  for (const [stage, env] of Object.entries(stages)) {
    result[stage] = redactEnvMap(env, options);
  }
  return result;
}
