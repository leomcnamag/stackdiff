import { mergeEnvMaps, formatMergeResult, MergeResult } from './merge';
import { EnvMap } from './parser';

const left: EnvMap = {
  APP_NAME: 'myapp',
  DB_HOST: 'localhost',
  LOG_LEVEL: 'info',
};

const right: EnvMap = {
  APP_NAME: 'myapp',
  DB_HOST: 'prod-db.example.com',
  NEW_KEY: 'new-value',
};

describe('mergeEnvMaps', () => {
  it('union strategy includes all keys', () => {
    const result = mergeEnvMaps(left, right, { strategy: 'union' });
    expect(Object.keys(result.merged)).toContain('LOG_LEVEL');
    expect(Object.keys(result.merged)).toContain('NEW_KEY');
    expect(Object.keys(result.merged)).toContain('APP_NAME');
  });

  it('left strategy keeps left values on conflict', () => {
    const result = mergeEnvMaps(left, right, { strategy: 'left' });
    expect(result.merged['DB_HOST']).toBe('localhost');
    expect(result.conflicts['DB_HOST']).toEqual({
      left: 'localhost',
      right: 'prod-db.example.com',
    });
  });

  it('right strategy keeps right values on conflict', () => {
    const result = mergeEnvMaps(left, right, { strategy: 'right' });
    expect(result.merged['DB_HOST']).toBe('prod-db.example.com');
  });

  it('intersection strategy only keeps shared keys', () => {
    const result = mergeEnvMaps(left, right, { strategy: 'intersection' });
    expect(Object.keys(result.merged)).not.toContain('LOG_LEVEL');
    expect(Object.keys(result.merged)).not.toContain('NEW_KEY');
    expect(Object.keys(result.merged)).toContain('APP_NAME');
    expect(result.dropped).toContain('LOG_LEVEL');
    expect(result.dropped).toContain('NEW_KEY');
  });

  it('tracks added keys from right', () => {
    const result = mergeEnvMaps(left, right, { strategy: 'union' });
    expect(result.added).toContain('NEW_KEY');
  });

  it('applies prefix to merged keys', () => {
    const result = mergeEnvMaps(left, right, { strategy: 'union', prefix: 'STAGE_' });
    expect(Object.keys(result.merged).every(k => k.startsWith('STAGE_'))).toBe(true);
  });

  it('no conflicts when maps are identical', () => {
    const result = mergeEnvMaps(left, left, { strategy: 'union' });
    expect(Object.keys(result.conflicts)).toHaveLength(0);
  });
});

describe('formatMergeResult', () => {
  it('includes summary counts', () => {
    const result = mergeEnvMaps(left, right, { strategy: 'union' });
    const output = formatMergeResult(result);
    expect(output).toContain('Merged:');
    expect(output).toContain('Conflicts:');
    expect(output).toContain('Added from right:');
  });

  it('lists conflict details when present', () => {
    const result = mergeEnvMaps(left, right, { strategy: 'left' });
    const output = formatMergeResult(result);
    expect(output).toContain('DB_HOST');
    expect(output).toContain('localhost');
    expect(output).toContain('prod-db.example.com');
  });

  it('omits conflict section when no conflicts', () => {
    const result = mergeEnvMaps(left, left, { strategy: 'union' });
    const output = formatMergeResult(result);
    expect(output).not.toContain('Conflicts (left kept):');
  });
});
