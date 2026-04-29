/**
 * interpolate.ts
 * Resolves variable references within env maps (e.g. FOO=${BAR}_suffix)
 */

export type EnvMap = Record<string, string>;

export interface InterpolateOptions {
  /** Maximum depth to prevent circular references */
  maxDepth?: number;
  /** If true, unresolved references are left as-is; otherwise they become empty string */
  keepUnresolved?: boolean;
}

const REF_RE = /\$\{([^}]+)\}|\$([A-Z_][A-Z0-9_]*)/g;

export function interpolateValue(
  value: string,
  env: EnvMap,
  options: InterpolateOptions = {},
  depth = 0
): string {
  const { maxDepth = 10, keepUnresolved = false } = options;
  if (depth > maxDepth) return value;

  return value.replace(REF_RE, (_match, braced, bare) => {
    const key = braced ?? bare;
    if (!(key in env)) {
      return keepUnresolved ? _match : "";
    }
    const resolved = env[key];
    // Recursively resolve nested references
    return interpolateValue(resolved, env, options, depth + 1);
  });
}

export function interpolateEnvMap(
  env: EnvMap,
  options: InterpolateOptions = {}
): EnvMap {
  const result: EnvMap = {};
  for (const [key, value] of Object.entries(env)) {
    result[key] = interpolateValue(value, env, options);
  }
  return result;
}

export function interpolateStages(
  stages: Record<string, EnvMap>,
  options: InterpolateOptions = {}
): Record<string, EnvMap> {
  const result: Record<string, EnvMap> = {};
  for (const [stage, env] of Object.entries(stages)) {
    result[stage] = interpolateEnvMap(env, options);
  }
  return result;
}
