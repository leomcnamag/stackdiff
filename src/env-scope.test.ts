import { extractScope, listScopes, partitionByScope, formatScopeSummary } from './env-scope';

const sample: Record<string, string> = {
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  AWS_REGION: 'us-east-1',
  AWS_KEY: 'abc123',
  APP_NAME: 'myapp',
  PORT: '3000',
};

describe('extractScope', () => {
  it('extracts keys matching a prefix', () => {
    const result = extractScope(sample, 'DB');
    expect(result.scope).toBe('DB_');
    expect(result.keys).toEqual(expect.arrayContaining(['DB_HOST', 'DB_PORT']));
    expect(result.entries['DB_HOST']).toBe('localhost');
  });

  it('handles prefix already ending with underscore', () => {
    const result = extractScope(sample, 'AWS_');
    expect(result.keys).toHaveLength(2);
  });

  it('returns empty entries when scope not found', () => {
    const result = extractScope(sample, 'REDIS');
    expect(result.keys).toHaveLength(0);
  });
});

describe('listScopes', () => {
  it('returns sorted unique scope prefixes', () => {
    const scopes = listScopes(sample);
    expect(scopes).toEqual(['APP', 'AWS', 'DB']);
  });

  it('ignores keys without underscore', () => {
    const scopes = listScopes({ PORT: '3000', HOST: 'localhost' });
    expect(scopes).toHaveLength(0);
  });
});

describe('partitionByScope', () => {
  it('groups entries by scope prefix', () => {
    const partitioned = partitionByScope(sample);
    expect(Object.keys(partitioned)).toEqual(
      expect.arrayContaining(['DB', 'AWS', 'APP', '__UNSCOPED__'])
    );
    expect(partitioned['DB']).toHaveProperty('DB_HOST');
    expect(partitioned['__UNSCOPED__']).toHaveProperty('PORT');
  });

  it('handles empty map', () => {
    expect(partitionByScope({})).toEqual({});
  });
});

describe('formatScopeSummary', () => {
  it('renders a readable summary', () => {
    const partitioned = partitionByScope(sample);
    const output = formatScopeSummary(partitioned);
    expect(output).toContain('Scope Summary');
    expect(output).toContain('DB');
    expect(output).toContain('AWS');
    expect(output).toMatch(/2 keys/);
  });

  it('uses singular for single key', () => {
    const output = formatScopeSummary({ APP: { APP_NAME: 'x' } });
    expect(output).toMatch(/1 key(?!s)/);
  });
});
