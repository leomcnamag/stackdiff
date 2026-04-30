import { sortEnvMap, groupByPrefix, sortStages } from './env-sort';

describe('sortEnvMap', () => {
  const env = { ZEBRA: 'z', APPLE: 'a', MANGO: 'm' };

  it('sorts keys ascending by default', () => {
    const result = sortEnvMap(env);
    expect(Object.keys(result)).toEqual(['APPLE', 'MANGO', 'ZEBRA']);
  });

  it('sorts keys descending', () => {
    const result = sortEnvMap(env, { order: 'desc' });
    expect(Object.keys(result)).toEqual(['ZEBRA', 'MANGO', 'APPLE']);
  });

  it('sorts by value ascending', () => {
    const result = sortEnvMap(env, { by: 'value' });
    expect(Object.keys(result)).toEqual(['APPLE', 'MANGO', 'ZEBRA']);
  });

  it('sorts by value descending', () => {
    const result = sortEnvMap(env, { by: 'value', order: 'desc' });
    expect(Object.keys(result)).toEqual(['ZEBRA', 'MANGO', 'APPLE']);
  });

  it('preserves values after sort', () => {
    const result = sortEnvMap(env);
    expect(result['APPLE']).toBe('a');
    expect(result['ZEBRA']).toBe('z');
  });
});

describe('groupByPrefix', () => {
  const env = {
    DB_HOST: 'localhost',
    DB_PORT: '5432',
    APP_NAME: 'stackdiff',
    APP_ENV: 'test',
    SECRET: 'abc',
  };

  it('groups keys by prefix', () => {
    const groups = groupByPrefix(env);
    const prefixes = groups.map((g) => g.prefix);
    expect(prefixes).toContain('APP');
    expect(prefixes).toContain('DB');
    expect(prefixes).toContain('__UNGROUPED__');
  });

  it('places keys without delimiter into __UNGROUPED__', () => {
    const groups = groupByPrefix(env);
    const ungrouped = groups.find((g) => g.prefix === '__UNGROUPED__');
    expect(ungrouped?.entries.map(([k]) => k)).toContain('SECRET');
  });

  it('sorts entries within each group', () => {
    const groups = groupByPrefix(env);
    const db = groups.find((g) => g.prefix === 'DB');
    expect(db?.entries.map(([k]) => k)).toEqual(['DB_HOST', 'DB_PORT']);
  });

  it('supports custom delimiter', () => {
    const custom = { 'APP.NAME': 'x', 'APP.ENV': 'y', STANDALONE: 'z' };
    const groups = groupByPrefix(custom, '.');
    expect(groups.find((g) => g.prefix === 'APP')?.entries).toHaveLength(2);
  });
});

describe('sortStages', () => {
  it('sorts each stage independently', () => {
    const stages = {
      prod: { Z: '1', A: '2' },
      dev: { M: '3', B: '4' },
    };
    const result = sortStages(stages);
    expect(Object.keys(result.prod)).toEqual(['A', 'Z']);
    expect(Object.keys(result.dev)).toEqual(['B', 'M']);
  });
});
