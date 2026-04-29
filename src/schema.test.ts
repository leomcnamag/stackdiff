import { validateAgainstSchema, formatSchemaResult, EnvSchema } from './schema';

const schema: EnvSchema = {
  DATABASE_URL: { required: true, description: 'DB connection string' },
  PORT: { required: true, pattern: '^\\d+$' },
  LOG_LEVEL: { required: false, pattern: '^(debug|info|warn|error)$' },
};

const validStages = {
  production: { DATABASE_URL: 'postgres://prod/db', PORT: '5432', LOG_LEVEL: 'info' },
  staging: { DATABASE_URL: 'postgres://staging/db', PORT: '5433' },
};

const invalidStages = {
  production: { DATABASE_URL: 'postgres://prod/db', PORT: 'not-a-number', LOG_LEVEL: 'verbose' },
  staging: { PORT: '5433' }, // missing DATABASE_URL
};

describe('validateAgainstSchema', () => {
  it('returns valid for conforming stages', () => {
    const result = validateAgainstSchema(validStages, schema);
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('detects missing required keys', () => {
    const result = validateAgainstSchema(invalidStages, schema);
    const missing = result.violations.filter(v => v.kind === 'missing_required');
    expect(missing.length).toBeGreaterThan(0);
    expect(missing[0].key).toBe('DATABASE_URL');
    expect(missing[0].stage).toBe('staging');
  });

  it('detects pattern mismatches', () => {
    const result = validateAgainstSchema(invalidStages, schema);
    const mismatches = result.violations.filter(v => v.kind === 'pattern_mismatch');
    expect(mismatches.some(v => v.key === 'PORT')).toBe(true);
    expect(mismatches.some(v => v.key === 'LOG_LEVEL')).toBe(true);
  });

  it('returns invalid when violations exist', () => {
    const result = validateAgainstSchema(invalidStages, schema);
    expect(result.valid).toBe(false);
  });

  it('handles empty stages', () => {
    const result = validateAgainstSchema({}, schema);
    expect(result.valid).toBe(true);
  });

  it('handles empty schema', () => {
    const result = validateAgainstSchema(validStages, {});
    expect(result.valid).toBe(true);
  });
});

describe('formatSchemaResult', () => {
  it('formats valid result', () => {
    const result = validateAgainstSchema(validStages, schema);
    expect(formatSchemaResult(result)).toContain('✔');
  });

  it('formats violations', () => {
    const result = validateAgainstSchema(invalidStages, schema);
    const output = formatSchemaResult(result);
    expect(output).toContain('✘');
    expect(output).toContain('DATABASE_URL');
    expect(output).toContain('staging');
  });
});
