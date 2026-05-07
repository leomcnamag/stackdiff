import { computeEnvStats, formatEnvStats, compareEnvStats } from './env-stats';

const sampleEnv = {
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_NAME: 'mydb',
  APP_NAME: 'stackdiff',
  APP_ENV: 'test',
  SECRET: 'abc',
  EMPTY_VAL: '',
  DUPLICATE: 'localhost',
};

describe('computeEnvStats', () => {
  it('counts total keys', () => {
    const stats = computeEnvStats(sampleEnv);
    expect(stats.totalKeys).toBe(8);
  });

  it('counts empty values', () => {
    const stats = computeEnvStats(sampleEnv);
    expect(stats.emptyValues).toBe(1);
  });

  it('detects duplicate values', () => {
    const stats = computeEnvStats(sampleEnv);
    // 'localhost' appears twice
    expect(stats.duplicateValues).toBeGreaterThan(0);
  });

  it('computes average value length', () => {
    const stats = computeEnvStats({ A: 'hello', B: 'world' });
    expect(stats.avgValueLength).toBe(5);
  });

  it('finds longest key', () => {
    const stats = computeEnvStats(sampleEnv);
    expect(stats.longestKey).toBe('DUPLICATE');
  });

  it('groups prefixes', () => {
    const stats = computeEnvStats(sampleEnv);
    expect(stats.prefixes['DB']).toBe(3);
    expect(stats.prefixes['APP']).toBe(2);
  });

  it('handles empty env map', () => {
    const stats = computeEnvStats({});
    expect(stats.totalKeys).toBe(0);
    expect(stats.avgValueLength).toBe(0);
    expect(stats.longestKey).toBe('');
  });
});

describe('formatEnvStats', () => {
  it('includes stage name when provided', () => {
    const stats = computeEnvStats(sampleEnv);
    const output = formatEnvStats(stats, 'production');
    expect(output).toContain('[production]');
  });

  it('includes total keys line', () => {
    const stats = computeEnvStats(sampleEnv);
    const output = formatEnvStats(stats);
    expect(output).toContain('Total keys:');
    expect(output).toContain('8');
  });

  it('includes top prefixes', () => {
    const stats = computeEnvStats(sampleEnv);
    const output = formatEnvStats(stats);
    expect(output).toContain('DB(3)');
  });
});

describe('compareEnvStats', () => {
  it('shows delta between two stages', () => {
    const a = computeEnvStats({ A: '1', B: '2' });
    const b = computeEnvStats({ A: '1', B: '2', C: '3' });
    const output = compareEnvStats(a, b, 'staging', 'production');
    expect(output).toContain('staging vs production');
    expect(output).toContain('+1');
  });

  it('shows negative delta', () => {
    const a = computeEnvStats({ A: '1', B: '2', C: '3' });
    const b = computeEnvStats({ A: '1' });
    const output = compareEnvStats(a, b, 'prod', 'dev');
    expect(output).toContain('-2');
  });
});
