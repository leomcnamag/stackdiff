import { promoteEnvMap, formatPromoteResult } from './promote';

const source = { API_URL: 'https://prod.api', SECRET: 'abc123', NEW_KEY: 'hello' };
const target = { API_URL: 'https://staging.api', DB_HOST: 'localhost', NEW_KEY: 'hello' };

describe('promoteEnvMap', () => {
  it('promotes new keys from source to target', () => {
    const result = promoteEnvMap(source, target, 'prod', 'staging');
    expect(result.promoted).toHaveProperty('SECRET', 'abc123');
  });

  it('detects conflicts without overwrite', () => {
    const result = promoteEnvMap(source, target, 'prod', 'staging');
    expect(result.conflicts).toHaveProperty('API_URL');
    expect(result.conflicts['API_URL'].source).toBe('https://prod.api');
    expect(result.conflicts['API_URL'].target).toBe('https://staging.api');
  });

  it('skips identical keys', () => {
    const result = promoteEnvMap(source, target, 'prod', 'staging');
    expect(result.skipped).toHaveProperty('NEW_KEY');
  });

  it('overwrites conflicts when overwrite=true', () => {
    const result = promoteEnvMap(source, target, 'prod', 'staging', { overwrite: true });
    expect(result.promoted).toHaveProperty('API_URL', 'https://prod.api');
    expect(result.conflicts).toEqual({});
  });

  it('promotes only specified keys', () => {
    const result = promoteEnvMap(source, target, 'prod', 'staging', { keys: ['SECRET'] });
    expect(result.promoted).toHaveProperty('SECRET');
    expect(result.promoted).not.toHaveProperty('API_URL');
  });

  it('ignores keys not present in source when keys filter is applied', () => {
    const result = promoteEnvMap(source, target, 'prod', 'staging', { keys: ['NONEXISTENT'] });
    expect(Object.keys(result.promoted)).toHaveLength(0);
  });

  it('sets source and target names correctly', () => {
    const result = promoteEnvMap(source, target, 'production', 'staging');
    expect(result.source).toBe('production');
    expect(result.target).toBe('staging');
  });

  it('dry run does not modify diff base', () => {
    const result = promoteEnvMap(source, target, 'prod', 'staging', { dryRun: true });
    expect(result.promoted).toHaveProperty('SECRET');
  });
});

describe('formatPromoteResult', () => {
  it('includes promoted keys in output', () => {
    const result = promoteEnvMap(source, target, 'prod', 'staging');
    const output = formatPromoteResult(result);
    expect(output).toContain('Promoted');
    expect(output).toContain('SECRET');
  });

  it('includes conflicts in output', () => {
    const result = promoteEnvMap(source, target, 'prod', 'staging');
    const output = formatPromoteResult(result);
    expect(output).toContain('Conflicts');
    expect(output).toContain('API_URL');
  });

  it('includes skipped keys in output', () => {
    const result = promoteEnvMap(source, target, 'prod', 'staging');
    const output = formatPromoteResult(result);
    expect(output).toContain('Skipped');
    expect(output).toContain('NEW_KEY');
  });

  it('shows source → target header', () => {
    const result = promoteEnvMap(source, target, 'prod', 'staging');
    const output = formatPromoteResult(result);
    expect(output).toContain('prod → staging');
  });
});
