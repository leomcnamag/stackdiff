import { validateEnvMap, validateStages, formatValidationReport, ValidationRule } from './validate';

const rules: ValidationRule[] = [
  { key: 'DATABASE_URL', required: true },
  { key: 'NODE_ENV', required: true, allowedValues: ['development', 'staging', 'production'] },
  { key: 'PORT', pattern: /^\d+$/ },
];

describe('validateEnvMap', () => {
  it('passes when all required keys are present and valid', () => {
    const env = { DATABASE_URL: 'postgres://localhost/db', NODE_ENV: 'production', PORT: '3000' };
    const result = validateEnvMap('prod', env, rules);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('reports error for missing required key', () => {
    const env = { NODE_ENV: 'production' };
    const result = validateEnvMap('prod', env, rules);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required key: DATABASE_URL');
  });

  it('reports error when pattern does not match', () => {
    const env = { DATABASE_URL: 'postgres://localhost/db', NODE_ENV: 'production', PORT: 'abc' };
    const result = validateEnvMap('prod', env, rules);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/PORT/);
  });

  it('reports warning when value not in allowedValues', () => {
    const env = { DATABASE_URL: 'postgres://localhost/db', NODE_ENV: 'test' };
    const result = validateEnvMap('ci', env, rules);
    expect(result.valid).toBe(true);
    expect(result.warnings[0]).toMatch(/NODE_ENV/);
  });

  it('skips optional keys that are absent', () => {
    const env = { DATABASE_URL: 'postgres://localhost/db', NODE_ENV: 'staging' };
    const result = validateEnvMap('staging', env, rules);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('validateStages', () => {
  it('aggregates results across multiple stages', () => {
    const stages = {
      prod: { DATABASE_URL: 'postgres://prod/db', NODE_ENV: 'production' },
      dev: { NODE_ENV: 'development' },
    };
    const report = validateStages(stages, rules);
    expect(report.results).toHaveLength(2);
    expect(report.totalErrors).toBeGreaterThan(0);
    expect(report.allValid).toBe(false);
  });

  it('returns allValid true when all stages pass', () => {
    const stages = {
      prod: { DATABASE_URL: 'postgres://prod/db', NODE_ENV: 'production' },
    };
    const report = validateStages(stages, rules);
    expect(report.allValid).toBe(true);
    expect(report.totalErrors).toBe(0);
  });
});

describe('formatValidationReport', () => {
  it('includes stage name and error summary', () => {
    const stages = { dev: { NODE_ENV: 'development' } };
    const report = validateStages(stages, rules);
    const output = formatValidationReport(report);
    expect(output).toContain('dev');
    expect(output).toContain('DATABASE_URL');
    expect(output).toContain('error(s)');
  });

  it('shows checkmark for valid stage', () => {
    const stages = { prod: { DATABASE_URL: 'db', NODE_ENV: 'production' } };
    const report = validateStages(stages, rules);
    const output = formatValidationReport(report);
    expect(output).toContain('✓');
  });
});
