import { EnvMap } from './parser';

export type MaskMode = 'full' | 'partial' | 'length';

export interface MaskOptions {
  mode?: MaskMode;
  char?: string;
  visibleChars?: number;
}

const DEFAULT_OPTS: Required<MaskOptions> = {
  mode: 'partial',
  char: '*',
  visibleChars: 4,
};

export function maskValue(value: string, opts: MaskOptions = {}): string {
  const { mode, char, visibleChars } = { ...DEFAULT_OPTS, ...opts };

  if (value.length === 0) return value;

  switch (mode) {
    case 'full':
      return char.repeat(value.length);

    case 'length':
      return char.repeat(8);

    case 'partial': {
      const show = Math.min(visibleChars, Math.floor(value.length / 2));
      if (show === 0) return char.repeat(value.length);
      const masked = char.repeat(value.length - show);
      return masked + value.slice(-show);
    }

    default:
      return char.repeat(value.length);
  }
}

export function maskEnvMap(
  env: EnvMap,
  keys: string[],
  opts: MaskOptions = {}
): EnvMap {
  const result: EnvMap = {};
  for (const [k, v] of Object.entries(env)) {
    result[k] = keys.includes(k) ? maskValue(v, opts) : v;
  }
  return result;
}

export function maskStages(
  stages: Record<string, EnvMap>,
  keys: string[],
  opts: MaskOptions = {}
): Record<string, EnvMap> {
  return Object.fromEntries(
    Object.entries(stages).map(([stage, env]) => [
      stage,
      maskEnvMap(env, keys, opts),
    ])
  );
}

export function formatMaskSummary(
  original: EnvMap,
  masked: EnvMap
): string {
  const maskedKeys = Object.keys(original).filter(
    (k) => original[k] !== masked[k]
  );
  const lines = [`Masked ${maskedKeys.length} key(s):`];
  for (const k of maskedKeys) {
    lines.push(`  ${k}: ${masked[k]}`);
  }
  return lines.join('\n');
}
