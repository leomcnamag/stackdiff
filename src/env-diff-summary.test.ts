import { buildDiffSummary, formatDiffSummary } from './env-diff-summary';

const fromMap = { API_URL: 'http://dev.api', DB_HOST: 'localhost', SECRET: 'abc' };
const toMap = { API_URL: 'http://prod.api', DB_HOST: 'localhost', NEW_KEY: 'value' };

describe('buildDiffSummary', () => {
  it('counts added keys', () => {
    const summary = buildDiffSummary('dev', fromMap, 'prod', toMap);
    expect(summary.addedCount).toBe(1);
    expect(summary.entries.find(e => e.key === 'NEW_KEY')?.status).toBe('added');
  });

  it('counts removed keys', () => {
    const summary = buildDiffSummary('dev', fromMap, 'prod', toMap);
    expect(summary.removedCount).toBe(1);
    expect(summary.entries.find(e => e.key === 'SECRET')?.status).toBe('removed');
  });

  it('counts changed keys', () => {
    const summary = buildDiffSummary('dev', fromMap, 'prod', toMap);
    expect(summary.changedCount).toBe(1);
    const entry = summary.entries.find(e => e.key === 'API_URL');
    expect(entry?.fromValue).toBe('http://dev.api');
    expect(entry?.toValue).toBe('http://prod.api');
  });

  it('counts unchanged keys', () => {
    const summary = buildDiffSummary('dev', fromMap, 'prod', toMap);
    expect(summary.unchangedCount).toBe(1);
    expect(summary.entries.find(e => e.key === 'DB_HOST')?.status).toBe('unchanged');
  });

  it('sets fromStage and toStage', () => {
    const summary = buildDiffSummary('dev', fromMap, 'prod', toMap);
    expect(summary.fromStage).toBe('dev');
    expect(summary.toStage).toBe('prod');
  });

  it('sorts keys alphabetically', () => {
    const summary = buildDiffSummary('dev', fromMap, 'prod', toMap);
    const keys = summary.entries.map(e => e.key);
    expect(keys).toEqual([...keys].sort());
  });

  it('handles empty maps', () => {
    const summary = buildDiffSummary('dev', {}, 'prod', {});
    expect(summary.entries).toHaveLength(0);
    expect(summary.addedCount).toBe(0);
  });
});

describe('formatDiffSummary', () => {
  it('includes stage names in header', () => {
    const summary = buildDiffSummary('dev', fromMap, 'prod', toMap);
    const output = formatDiffSummary(summary);
    expect(output).toContain('dev → prod');
  });

  it('shows counts in summary line', () => {
    const summary = buildDiffSummary('dev', fromMap, 'prod', toMap);
    const output = formatDiffSummary(summary);
    expect(output).toContain('+1');
    expect(output).toContain('-1');
    expect(output).toContain('~1');
  });

  it('hides unchanged by default', () => {
    const summary = buildDiffSummary('dev', fromMap, 'prod', toMap);
    const output = formatDiffSummary(summary);
    expect(output).not.toContain('= DB_HOST');
  });

  it('shows unchanged when flag is set', () => {
    const summary = buildDiffSummary('dev', fromMap, 'prod', toMap);
    const output = formatDiffSummary(summary, true);
    expect(output).toContain('= DB_HOST');
  });

  it('formats changed entry with arrow', () => {
    const summary = buildDiffSummary('dev', fromMap, 'prod', toMap);
    const output = formatDiffSummary(summary);
    expect(output).toContain('→');
  });
});
