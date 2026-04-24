import { diffSnapshots, formatSnapshotDiff } from './snapshot-diff';
import { Snapshot } from './snapshot';

const makeSnap = (stage: string, vars: Record<string, string>): Snapshot => ({
  timestamp: '2024-01-01T00-00-00-000Z',
  stage,
  vars,
});

describe('diffSnapshots', () => {
  it('detects added keys', () => {
    const from = makeSnap('prod', { FOO: 'bar' });
    const to = makeSnap('prod', { FOO: 'bar', NEW_KEY: 'value' });
    const result = diffSnapshots(from, to);
    expect(result.diff.added).toContain('NEW_KEY');
  });

  it('detects removed keys', () => {
    const from = makeSnap('prod', { FOO: 'bar', OLD: 'gone' });
    const to = makeSnap('prod', { FOO: 'bar' });
    const result = diffSnapshots(from, to);
    expect(result.diff.removed).toContain('OLD');
  });

  it('detects changed values', () => {
    const from = makeSnap('staging', { DB_URL: 'old-url' });
    const to = makeSnap('staging', { DB_URL: 'new-url' });
    const result = diffSnapshots(from, to);
    expect(result.diff.changed[0]).toMatchObject({ key: 'DB_URL', from: 'old-url', to: 'new-url' });
  });

  it('includes metadata in result', () => {
    const from = makeSnap('dev', {});
    const to = makeSnap('prod', {});
    const result = diffSnapshots(from, to);
    expect(result.from.stage).toBe('dev');
    expect(result.to.stage).toBe('prod');
  });
});

describe('formatSnapshotDiff', () => {
  it('shows no differences message when identical', () => {
    const snap = makeSnap('prod', { A: '1' });
    const result = diffSnapshots(snap, { ...snap });
    const output = formatSnapshotDiff(result);
    expect(output).toContain('No differences found.');
  });

  it('includes added/removed/changed sections', () => {
    const from = makeSnap('prod', { OLD: 'x', SAME: 'y', CHANGE: 'a' });
    const to = makeSnap('prod', { NEW: 'z', SAME: 'y', CHANGE: 'b' });
    const result = diffSnapshots(from, to);
    const output = formatSnapshotDiff(result);
    expect(output).toContain('Added:');
    expect(output).toContain('Removed:');
    expect(output).toContain('Changed:');
    expect(output).toContain('Unchanged: 1 variable(s)');
  });
});
