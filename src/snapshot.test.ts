import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { saveSnapshot, loadSnapshot, listSnapshots } from './snapshot';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stackdiff-snap-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('saveSnapshot', () => {
  it('creates a snapshot file', () => {
    const vars = { FOO: 'bar', BAZ: '123' };
    const filepath = saveSnapshot('production', vars, tmpDir);
    expect(fs.existsSync(filepath)).toBe(true);
  });

  it('snapshot contains correct data', () => {
    const vars = { API_KEY: 'secret' };
    const filepath = saveSnapshot('staging', vars, tmpDir);
    const snap = loadSnapshot(filepath);
    expect(snap.stage).toBe('staging');
    expect(snap.vars).toEqual(vars);
    expect(snap.timestamp).toBeDefined();
  });

  it('updates index.json on save', () => {
    saveSnapshot('dev', { X: '1' }, tmpDir);
    const index = JSON.parse(fs.readFileSync(path.join(tmpDir, 'index.json'), 'utf-8'));
    expect(index.snapshots).toHaveLength(1);
    expect(index.snapshots[0].stage).toBe('dev');
  });
});

describe('listSnapshots', () => {
  it('returns empty array if dir does not exist', () => {
    const result = listSnapshots('/non/existent/path');
    expect(result).toEqual([]);
  });

  it('lists all snapshots', () => {
    saveSnapshot('prod', { A: '1' }, tmpDir);
    saveSnapshot('staging', { B: '2' }, tmpDir);
    const snaps = listSnapshots(tmpDir);
    expect(snaps).toHaveLength(2);
  });

  it('filters snapshots by stage', () => {
    saveSnapshot('prod', { A: '1' }, tmpDir);
    saveSnapshot('staging', { B: '2' }, tmpDir);
    const snaps = listSnapshots(tmpDir, 'prod');
    expect(snaps).toHaveLength(1);
    expect(snaps[0].stage).toBe('prod');
  });
});
