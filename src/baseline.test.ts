import * as fs from 'fs';
import * as path from 'path';
import {
  saveBaseline,
  loadBaseline,
  listBaselines,
  deleteBaseline,
} from './baseline';

const BASELINE_DIR = '.stackdiff/baselines';

function cleanup() {
  if (fs.existsSync(BASELINE_DIR)) {
    fs.rmSync(BASELINE_DIR, { recursive: true, force: true });
  }
}

beforeEach(cleanup);
afterAll(cleanup);

describe('saveBaseline', () => {
  it('saves a baseline and returns it', () => {
    const vars = { API_KEY: 'abc', NODE_ENV: 'production' };
    const baseline = saveBaseline('prod-snapshot', 'production', vars);
    expect(baseline.name).toBe('prod-snapshot');
    expect(baseline.stage).toBe('production');
    expect(baseline.vars).toEqual(vars);
    expect(baseline.createdAt).toBeTruthy();
  });

  it('writes file to disk', () => {
    saveBaseline('test-bl', 'staging', { FOO: 'bar' });
    expect(fs.existsSync(path.join(BASELINE_DIR, 'test-bl.json'))).toBe(true);
  });
});

describe('loadBaseline', () => {
  it('returns null for missing baseline', () => {
    expect(loadBaseline('nonexistent')).toBeNull();
  });

  it('loads a saved baseline', () => {
    saveBaseline('load-test', 'dev', { X: '1' });
    const loaded = loadBaseline('load-test');
    expect(loaded).not.toBeNull();
    expect(loaded!.vars).toEqual({ X: '1' });
  });
});

describe('listBaselines', () => {
  it('returns empty array when no baselines exist', () => {
    expect(listBaselines()).toEqual([]);
  });

  it('lists saved baselines', () => {
    saveBaseline('bl-a', 'dev', {});
    saveBaseline('bl-b', 'prod', {});
    const list = listBaselines();
    expect(list.map((b) => b.name)).toContain('bl-a');
    expect(list.map((b) => b.name)).toContain('bl-b');
  });
});

describe('deleteBaseline', () => {
  it('returns false for nonexistent baseline', () => {
    expect(deleteBaseline('ghost')).toBe(false);
  });

  it('deletes an existing baseline', () => {
    saveBaseline('to-delete', 'staging', { A: '1' });
    expect(deleteBaseline('to-delete')).toBe(true);
    expect(loadBaseline('to-delete')).toBeNull();
    expect(listBaselines().find((b) => b.name === 'to-delete')).toBeUndefined();
  });
});
