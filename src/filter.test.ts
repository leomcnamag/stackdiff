import { describe, it, expect } from 'vitest';
import { matchesPattern, filterStages, StageMap } from './filter';

const stages: StageMap = {
  dev: {
    DB_HOST: 'localhost',
    DB_PORT: '5432',
    API_KEY: 'dev-key',
    LOG_LEVEL: 'debug',
  },
  prod: {
    DB_HOST: 'prod.db.internal',
    DB_PORT: '5432',
    API_KEY: 'prod-key',
  },
};

describe('matchesPattern', () => {
  it('matches exact key', () => {
    expect(matchesPattern('DB_HOST', 'DB_HOST')).toBe(true);
    expect(matchesPattern('DB_HOST', 'API_KEY')).toBe(false);
  });

  it('matches glob prefix', () => {
    expect(matchesPattern('DB_HOST', 'DB_*')).toBe(true);
    expect(matchesPattern('DB_PORT', 'DB_*')).toBe(true);
    expect(matchesPattern('API_KEY', 'DB_*')).toBe(false);
  });
});

describe('filterStages', () => {
  it('returns all keys when no options given', () => {
    const result = filterStages(stages, {});
    expect(Object.keys(result.dev)).toHaveLength(4);
    expect(Object.keys(result.prod)).toHaveLength(4);
  });

  it('filters by specific keys', () => {
    const result = filterStages(stages, { keys: ['DB_HOST'] });
    expect(Object.keys(result.dev)).toEqual(['DB_HOST']);
  });

  it('excludes specified keys', () => {
    const result = filterStages(stages, { exclude: ['API_KEY', 'LOG_LEVEL'] });
    expect(result.dev).not.toHaveProperty('API_KEY');
    expect(result.dev).not.toHaveProperty('LOG_LEVEL');
    expect(result.dev).toHaveProperty('DB_HOST');
  });

  it('filters by pattern', () => {
    const result = filterStages(stages, { pattern: 'DB_*' });
    expect(Object.keys(result.dev)).toEqual(expect.arrayContaining(['DB_HOST', 'DB_PORT']));
    expect(Object.keys(result.dev)).not.toContain('API_KEY');
  });

  it('onlyChanged filters out identical values', () => {
    const result = filterStages(stages, { onlyChanged: true });
    expect(result.dev).not.toHaveProperty('DB_PORT'); // same in both
    expect(result.dev).toHaveProperty('DB_HOST');     // differs
    expect(result.dev).toHaveProperty('API_KEY');     // differs
  });

  it('onlyMissing filters to keys absent in at least one stage', () => {
    const result = filterStages(stages, { onlyMissing: true });
    expect(result.dev).toHaveProperty('LOG_LEVEL');   // missing in prod
    expect(result.dev).not.toHaveProperty('DB_HOST'); // present in both
  });
});
