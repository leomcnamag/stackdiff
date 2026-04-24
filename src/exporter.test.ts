import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { exportDiff, exportToJson, exportToCsv, exportToMarkdown } from './exporter';
import { DiffResult } from './diff';

const sampleDiffs: DiffResult[] = [
  {
    stage: 'production',
    entries: [
      { key: 'API_URL', status: 'changed', baseValue: 'http://dev.api', targetValue: 'http://prod.api' },
      { key: 'DEBUG', status: 'removed', baseValue: 'true', targetValue: undefined },
      { key: 'NEW_FLAG', status: 'added', baseValue: undefined, targetValue: 'enabled' },
    ],
  },
];

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stackdiff-export-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('exportToJson', () => {
  it('writes a valid JSON file', () => {
    const out = path.join(tmpDir, 'out.json');
    exportToJson(sampleDiffs, out);
    const content = fs.readFileSync(out, 'utf-8');
    const parsed = JSON.parse(content);
    expect(Array.isArray(parsed)).toBe(true);
  });
});

describe('exportToCsv', () => {
  it('writes CSV with header and rows', () => {
    const out = path.join(tmpDir, 'out.csv');
    exportToCsv(sampleDiffs, out);
    const lines = fs.readFileSync(out, 'utf-8').split('\n');
    expect(lines[0]).toBe('stage,key,status,baseValue,targetValue');
    expect(lines.length).toBe(4);
  });

  it('includes all entry statuses', () => {
    const out = path.join(tmpDir, 'out.csv');
    exportToCsv(sampleDiffs, out);
    const content = fs.readFileSync(out, 'utf-8');
    expect(content).toContain('changed');
    expect(content).toContain('removed');
    expect(content).toContain('added');
  });
});

describe('exportToMarkdown', () => {
  it('writes markdown with stage heading', () => {
    const out = path.join(tmpDir, 'out.md');
    exportToMarkdown(sampleDiffs, out);
    const content = fs.readFileSync(out, 'utf-8');
    expect(content).toContain('## Stage: production');
    expect(content).toContain('| Key | Status |');
  });
});

describe('exportDiff', () => {
  it('creates nested directories if needed', () => {
    const out = path.join(tmpDir, 'nested', 'dir', 'out.json');
    exportDiff(sampleDiffs, out, 'json');
    expect(fs.existsSync(out)).toBe(true);
  });

  it('throws on unsupported format', () => {
    const out = path.join(tmpDir, 'out.txt');
    expect(() => exportDiff(sampleDiffs, out, 'xml' as any)).toThrow('Unsupported export format');
  });
});
