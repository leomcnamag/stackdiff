import { compareStages, formatCompareReport } from './env-compare';

const dev = { API_URL: 'http://dev.api', DB_HOST: 'localhost', DEV_ONLY: 'yes' };
const staging = { API_URL: 'http://staging.api', DB_HOST: 'localhost' };
const prod = { API_URL: 'http://prod.api', DB_HOST: 'db.prod.internal' };

describe('compareStages', () => {
  it('marks keys with identical values as consistent', () => {
    const report = compareStages({ dev, staging, prod });
    expect(report.consistent).toContain('DB_HOST');
  });

  it('marks keys with differing values as inconsistent', () => {
    const report = compareStages({ dev, staging, prod });
    expect(report.inconsistent).toContain('API_URL');
  });

  it('marks keys absent in some stages as missing', () => {
    const report = compareStages({ dev, staging, prod });
    expect(report.missing).toContain('DEV_ONLY');
  });

  it('returns all keys sorted', () => {
    const report = compareStages({ dev, staging, prod });
    const keys = report.results.map((r) => r.key);
    expect(keys).toEqual([...keys].sort());
  });

  it('handles single stage gracefully', () => {
    const report = compareStages({ dev });
    expect(report.consistent).toContain('API_URL');
    expect(report.inconsistent).toHaveLength(0);
  });

  it('handles empty stages', () => {
    const report = compareStages({});
    expect(report.results).toHaveLength(0);
  });

  it('includes stage values in each result', () => {
    const report = compareStages({ dev, prod });
    const apiResult = report.results.find((r) => r.key === 'API_URL')!;
    expect(apiResult.stages.dev).toBe('http://dev.api');
    expect(apiResult.stages.prod).toBe('http://prod.api');
  });

  it('shows undefined for missing stage values', () => {
    const report = compareStages({ dev, prod });
    const devOnly = report.results.find((r) => r.key === 'DEV_ONLY')!;
    expect(devOnly.stages.prod).toBeUndefined();
  });
});

describe('formatCompareReport', () => {
  it('includes stage names in header', () => {
    const report = compareStages({ dev, prod });
    const output = formatCompareReport(report, ['dev', 'prod']);
    expect(output).toContain('dev');
    expect(output).toContain('prod');
  });

  it('includes summary line', () => {
    const report = compareStages({ dev, staging, prod });
    const output = formatCompareReport(report, ['dev', 'staging', 'prod']);
    expect(output).toContain('Summary:');
    expect(output).toContain('consistent');
    expect(output).toContain('inconsistent');
    expect(output).toContain('missing');
  });

  it('marks consistent keys with checkmark', () => {
    const report = compareStages({ dev, prod });
    const output = formatCompareReport(report, ['dev', 'prod']);
    expect(output).toContain('✓');
  });

  it('marks inconsistent keys with cross', () => {
    const report = compareStages({ dev, prod });
    const output = formatCompareReport(report, ['dev', 'prod']);
    expect(output).toContain('✗');
  });
});
