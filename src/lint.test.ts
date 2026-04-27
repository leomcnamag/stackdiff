import { lintEnvMap, lintStages, formatLintReport, defaultRules } from './lint';
import { EnvMap } from './parser';

describe('lintEnvMap', () => {
  it('passes a clean env map', () => {
    const env: EnvMap = { API_URL: 'https://example.com', PORT: '3000' };
    const report = lintEnvMap('production', env);
    expect(report.passed).toBe(true);
    expect(report.results).toHaveLength(0);
  });

  it('flags empty values', () => {
    const env: EnvMap = { API_KEY: '' };
    const report = lintEnvMap('staging', env);
    expect(report.passed).toBe(false);
    const issue = report.results.find((r) => r.rule === 'no-empty-value');
    expect(issue).toBeDefined();
    expect(issue?.key).toBe('API_KEY');
  });

  it('flags lowercase keys', () => {
    const env: EnvMap = { apiKey: 'abc123' };
    const report = lintEnvMap('dev', env);
    expect(report.passed).toBe(false);
    const issue = report.results.find((r) => r.rule === 'uppercase-key');
    expect(issue).toBeDefined();
  });

  it('flags keys with whitespace', () => {
    const env: EnvMap = { 'MY KEY': 'value' };
    const report = lintEnvMap('dev', env);
    const issue = report.results.find((r) => r.rule === 'no-whitespace-key');
    expect(issue).toBeDefined();
  });

  it('flags values wrapped in quotes', () => {
    const env: EnvMap = { SECRET: '"my-secret"' };
    const report = lintEnvMap('dev', env);
    const issue = report.results.find((r) => r.rule === 'no-quotes-in-value');
    expect(issue).toBeDefined();
  });

  it('respects custom rules', () => {
    const env: EnvMap = { MY_KEY: 'bad' };
    const customRule = {
      name: 'no-bad-value',
      check: (_k: string, v: string) =>
        v === 'bad' ? 'Value cannot be "bad"' : null,
    };
    const report = lintEnvMap('test', env, [customRule]);
    expect(report.passed).toBe(false);
    expect(report.results[0].rule).toBe('no-bad-value');
  });
});

describe('lintStages', () => {
  it('returns a report per stage', () => {
    const stages: Record<string, EnvMap> = {
      dev: { DEBUG: 'true' },
      prod: { DEBUG: '' },
    };
    const reports = lintStages(stages);
    expect(reports).toHaveLength(2);
    const prodReport = reports.find((r) => r.stage === 'prod');
    expect(prodReport?.passed).toBe(false);
  });
});

describe('formatLintReport', () => {
  it('formats a passing report', () => {
    const report = { stage: 'prod', results: [], passed: true };
    expect(formatLintReport(report)).toContain('✔ prod');
  });

  it('formats a failing report with issues', () => {
    const report = {
      stage: 'dev',
      results: [{ key: 'FOO', rule: 'no-empty-value', message: 'Key "FOO" has an empty value' }],
      passed: false,
    };
    const output = formatLintReport(report);
    expect(output).toContain('✘ dev');
    expect(output).toContain('no-empty-value');
    expect(output).toContain('FOO');
  });
});
