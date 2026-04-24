import { diffAgainstBaseline, formatBaselineDiff } from './baseline-diff';
import { Baseline } from './baseline';

const makeBaseline = (vars: Record<string, string>): Baseline => ({
  name: 'test-baseline',
  stage: 'production',
  vars,
  createdAt: '2024-01-01T00:00:00.000Z',
});

describe('diffAgainstBaseline', () => {
  it('detects added keys', () => {
    const result = diffAgainstBaseline(makeBaseline({ A: '1' }), { A: '1', B: '2' });
    const added = result.entries.find((e) => e.key === 'B');
    expect(added?.status).toBe('added');
    expect(result.addedCount).toBe(1);
  });

  it('detects removed keys', () => {
    const result = diffAgainstBaseline(makeBaseline({ A: '1', B: '2' }), { A: '1' });
    const removed = result.entries.find((e) => e.key === 'B');
    expect(removed?.status).toBe('removed');
    expect(result.removedCount).toBe(1);
  });

  it('detects changed values', () => {
    const result = diffAgainstBaseline(makeBaseline({ A: 'old' }), { A: 'new' });
    const changed = result.entries.find((e) => e.key === 'A');
    expect(changed?.status).toBe('changed');
    expect(changed?.baselineValue).toBe('old');
    expect(changed?.currentValue).toBe('new');
    expect(result.changedCount).toBe(1);
  });

  it('marks unchanged keys correctly', () => {
    const result = diffAgainstBaseline(makeBaseline({ A: '1' }), { A: '1' });
    expect(result.entries[0].status).toBe('unchanged');
    expect(result.unchangedCount).toBe(1);
  });

  it('returns sorted keys', () => {
    const result = diffAgainstBaseline(makeBaseline({ Z: '1', A: '2' }), { Z: '1', A: '2' });
    expect(result.entries.map((e) => e.key)).toEqual(['A', 'Z']);
  });
});

describe('formatBaselineDiff', () => {
  it('includes baseline name and date in output', () => {
    const result = diffAgainstBaseline(makeBaseline({}), {});
    const output = formatBaselineDiff(result);
    expect(output).toContain('test-baseline');
    expect(output).toContain('2024-01-01');
  });

  it('hides unchanged entries by default', () => {
    const result = diffAgainstBaseline(makeBaseline({ A: '1' }), { A: '1' });
    const output = formatBaselineDiff(result);
    expect(output).not.toContain('A:');
  });

  it('shows unchanged entries when flag is set', () => {
    const result = diffAgainstBaseline(makeBaseline({ A: '1' }), { A: '1' });
    const output = formatBaselineDiff(result, true);
    expect(output).toContain('A:');
  });

  it('shows arrow for changed values', () => {
    const result = diffAgainstBaseline(makeBaseline({ URL: 'http://old' }), { URL: 'http://new' });
    const output = formatBaselineDiff(result);
    expect(output).toContain('→');
  });
});
