import { describe, it, expect } from 'vitest';
import { computeStats, formatStats, StageMap } from './reporter';
import type { StageMap as SM } from './filter';

const stages: SM = {
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
    NEW_RELIC: 'enabled',
  },
};

describe('computeStats', () => {
  it('counts total keys across both stages', () => {
    const stats = computeStats(stages, { from: 'dev', to: 'prod' });
    expect(stats.totalKeys).toBe(5); // DB_HOST, DB_PORT, API_KEY, LOG_LEVEL, NEW_RELIC
  });

  it('counts changed keys correctly', () => {
    const stats = computeStats(stages, { from: 'dev', to: 'prod' });
    expect(stats.changedKeys).toBe(2); // DB_HOST, API_KEY
  });

  it('counts missing keys (in from but not to)', () => {
    const stats = computeStats(stages, { from: 'dev', to: 'prod' });
    expect(stats.missingKeys).toBe(1); // LOG_LEVEL
  });

  it('counts added keys (in to but not from)', () => {
    const stats = computeStats(stages, { from: 'dev', to: 'prod' });
    expect(stats.addedKeys).toBe(1); // NEW_RELIC
  });

  it('returns zero diff for identical stages', () => {
    const same: SM = { a: { X: '1' }, b: { X: '1' } };
    const stats = computeStats(same, { from: 'a', to: 'b' });
    expect(stats.changedKeys).toBe(0);
    expect(stats.missingKeys).toBe(0);
    expect(stats.addedKeys).toBe(0);
  });
});

describe('formatStats', () => {
  it('includes stage names in output', () => {
    const stats = computeStats(stages, { from: 'dev', to: 'prod' });
    const output = formatStats(stats);
    expect(output).toContain('dev');
    expect(output).toContain('prod');
  });

  it('includes all stat fields', () => {
    const stats = computeStats(stages, { from: 'dev', to: 'prod' });
    const output = formatStats(stats);
    expect(output).toContain('Total keys');
    expect(output).toContain('Changed');
    expect(output).toContain('Missing');
    expect(output).toContain('Added');
  });
});
