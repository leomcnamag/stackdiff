import { applyRule, transformEnvMap, transformStages, TransformRule } from './transform';

const sampleEnv: Record<string, string> = {
  DATABASE_URL: 'postgres://localhost/db',
  API_KEY: 'secret',
  debug: 'true',
};

describe('applyRule', () => {
  it('adds prefix to all keys when no match', () => {
    const r: TransformRule = { type: 'prefix', value: 'APP_' };
    expect(applyRule(r, 'KEY', 'val').key).toBe('APP_KEY');
  });

  it('adds prefix only to matching keys', () => {
    const r: TransformRule = { type: 'prefix', match: 'API', value: 'PROD_' };
    expect(applyRule(r, 'API_KEY', 'v').key).toBe('PROD_API_KEY');
    expect(applyRule(r, 'DATABASE_URL', 'v').key).toBe('DATABASE_URL');
  });

  it('adds suffix to matching keys', () => {
    const r: TransformRule = { type: 'suffix', match: 'URL', value: '_V2' };
    expect(applyRule(r, 'DATABASE_URL', 'v').key).toBe('DATABASE_URL_V2');
    expect(applyRule(r, 'API_KEY', 'v').key).toBe('API_KEY');
  });

  it('uppercases value', () => {
    const r: TransformRule = { type: 'uppercase' };
    expect(applyRule(r, 'debug', 'true').value).toBe('TRUE');
  });

  it('lowercases value', () => {
    const r: TransformRule = { type: 'lowercase' };
    expect(applyRule(r, 'K', 'HELLO').value).toBe('hello');
  });

  it('renames exact key', () => {
    const r: TransformRule = { type: 'rename', from: 'debug', to: 'DEBUG_MODE' };
    expect(applyRule(r, 'debug', 'true').key).toBe('DEBUG_MODE');
    expect(applyRule(r, 'other', 'v').key).toBe('other');
  });

  it('replaces substring in value', () => {
    const r: TransformRule = { type: 'replace', from: 'localhost', to: 'prod-db' };
    expect(applyRule(r, 'DATABASE_URL', 'postgres://localhost/db').value).toBe('postgres://prod-db/db');
  });
});

describe('transformEnvMap', () => {
  it('applies multiple rules in sequence', () => {
    const rules: TransformRule[] = [
      { type: 'rename', from: 'debug', to: 'DEBUG' },
      { type: 'uppercase', match: 'DEBUG' },
    ];
    const result = transformEnvMap(sampleEnv, rules);
    expect(result['DEBUG']).toBe('TRUE');
    expect(result['debug']).toBeUndefined();
  });

  it('returns unchanged map with empty rules', () => {
    expect(transformEnvMap(sampleEnv, [])).toEqual(sampleEnv);
  });
});

describe('transformStages', () => {
  it('applies rules to all stages', () => {
    const stages = { dev: { KEY: 'val' }, prod: { KEY: 'VAL' } };
    const result = transformStages(stages, [{ type: 'lowercase' }]);
    expect(result.dev.KEY).toBe('val');
    expect(result.prod.KEY).toBe('val');
  });
});
