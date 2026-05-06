import { pruneEnvMap, pruneStages, formatPruneResult } from './env-prune';

const sampleEnv = {
  APP_NAME: 'myapp',
  DB_HOST: 'localhost',
  DB_PASS: '',
  SECRET: 'abc123',
  API_KEY: 'abc123',
  UNUSED: 'value',
};

describe('pruneEnvMap', () => {
  it('removes explicitly listed keys', () => {
    const result = pruneEnvMap(sampleEnv, { removeKeys: ['UNUSED'] });
    expect(result.pruned).not.toHaveProperty('UNUSED');
    expect(result.removed).toHaveProperty('UNUSED');
    expect(result.reasons['UNUSED']).toBe('explicitly removed');
  });

  it('keeps only keys in keepKeys list', () => {
    const result = pruneEnvMap(sampleEnv, { keepKeys: ['APP_NAME', 'DB_HOST'] });
    expect(Object.keys(result.pruned)).toEqual(['APP_NAME', 'DB_HOST']);
    expect(result.removed).toHaveProperty('SECRET');
    expect(result.reasons['SECRET']).toBe('not in keep list');
  });

  it('removes empty values when removeEmpty is true', () => {
    const result = pruneEnvMap(sampleEnv, { removeEmpty: true });
    expect(result.pruned).not.toHaveProperty('DB_PASS');
    expect(result.reasons['DB_PASS']).toBe('empty value');
  });

  it('removes duplicate values when removeDuplicateValues is true', () => {
    const result = pruneEnvMap(sampleEnv, { removeDuplicateValues: true });
    const keys = Object.keys(result.removed);
    // SECRET and API_KEY share value 'abc123'; second encountered should be removed
    expect(keys.some(k => result.reasons[k] === 'duplicate value')).toBe(true);
  });

  it('returns all keys when no options provided', () => {
    const result = pruneEnvMap(sampleEnv);
    expect(result.pruned).toEqual(sampleEnv);
    expect(Object.keys(result.removed)).toHaveLength(0);
  });

  it('combines multiple options', () => {
    const result = pruneEnvMap(sampleEnv, { removeEmpty: true, removeKeys: ['UNUSED'] });
    expect(result.pruned).not.toHaveProperty('DB_PASS');
    expect(result.pruned).not.toHaveProperty('UNUSED');
  });
});

describe('pruneStages', () => {
  it('prunes each stage independently', () => {
    const stages = { dev: sampleEnv, prod: { ...sampleEnv, EXTRA: '' } };
    const results = pruneStages(stages, { removeEmpty: true });
    expect(results.dev.pruned).not.toHaveProperty('DB_PASS');
    expect(results.prod.pruned).not.toHaveProperty('EXTRA');
  });
});

describe('formatPruneResult', () => {
  it('formats result without stage', () => {
    const result = pruneEnvMap(sampleEnv, { removeKeys: ['UNUSED'] });
    const output = formatPruneResult(result);
    expect(output).toContain('Prune result');
    expect(output).toContain('Removed: 1');
    expect(output).toContain('UNUSED: explicitly removed');
  });

  it('includes stage name when provided', () => {
    const result = pruneEnvMap(sampleEnv, { removeEmpty: true });
    const output = formatPruneResult(result, 'staging');
    expect(output).toContain('[staging]');
  });
});
