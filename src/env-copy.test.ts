import { copyEnvKeys, formatCopyResult } from './env-copy';

const source = {
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  APP_NAME: 'myapp',
  APP_ENV: 'production',
  SECRET_KEY: 'abc123',
};

const target = {
  DB_HOST: 'prod-db',
  EXISTING: 'value',
};

describe('copyEnvKeys', () => {
  it('copies all keys when no filter given', () => {
    const result = copyEnvKeys(source, {});
    expect(result.copied).toHaveLength(5);
    expect(result.target).toMatchObject(source);
  });

  it('copies only specified keys', () => {
    const result = copyEnvKeys(source, {}, { keys: ['DB_HOST', 'DB_PORT'] });
    expect(result.copied).toEqual(['DB_HOST', 'DB_PORT']);
    expect(result.target['DB_HOST']).toBe('localhost');
    expect(result.target['DB_PORT']).toBe('5432');
    expect(result.target['APP_NAME']).toBeUndefined();
  });

  it('copies keys matching prefix', () => {
    const result = copyEnvKeys(source, {}, { prefix: 'APP_' });
    expect(result.copied).toEqual(['APP_NAME', 'APP_ENV']);
  });

  it('skips existing keys without overwrite', () => {
    const result = copyEnvKeys(source, target, { keys: ['DB_HOST'] });
    expect(result.skipped).toContain('DB_HOST');
    expect(result.target['DB_HOST']).toBe('prod-db');
  });

  it('overwrites existing keys when overwrite=true', () => {
    const result = copyEnvKeys(source, target, { keys: ['DB_HOST'], overwrite: true });
    expect(result.copied).toContain('DB_HOST');
    expect(result.target['DB_HOST']).toBe('localhost');
  });

  it('strips prefix from target key when stripPrefix=true', () => {
    const result = copyEnvKeys(source, {}, { prefix: 'APP_', stripPrefix: true });
    expect(result.target['NAME']).toBe('myapp');
    expect(result.target['ENV']).toBe('production');
    expect(result.target['APP_NAME']).toBeUndefined();
  });

  it('preserves existing target keys not in source', () => {
    const result = copyEnvKeys(source, target, { keys: ['DB_PORT'] });
    expect(result.target['EXISTING']).toBe('value');
  });
});

describe('formatCopyResult', () => {
  it('shows copied count', () => {
    const result = copyEnvKeys(source, {}, { keys: ['DB_HOST'] });
    const output = formatCopyResult(result);
    expect(output).toContain('Copied:  1 key(s)');
    expect(output).toContain('+ DB_HOST');
  });

  it('shows skipped keys with hint', () => {
    const result = copyEnvKeys(source, target, { keys: ['DB_HOST'] });
    const output = formatCopyResult(result);
    expect(output).toContain('Skipped:');
    expect(output).toContain('--overwrite');
    expect(output).toContain('~ DB_HOST');
  });
});
