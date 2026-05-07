import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseDiffSummaryArgs, runDiffSummaryCliWithArgs } from './env-diff-summary-cli';

function writeTempEnv(content: string): string {
  const file = path.join(os.tmpdir(), `stackdiff-test-${Date.now()}-${Math.random().toString(36).slice(2)}.env`);
  fs.writeFileSync(file, content);
  return file;
}

describe('parseDiffSummaryArgs', () => {
  it('parses from and to files', () => {
    const args = parseDiffSummaryArgs(['node', 'cli', 'a.env', 'b.env']);
    expect(args.fromFile).toBe('a.env');
    expect(args.toFile).toBe('b.env');
  });

  it('defaults showUnchanged to false', () => {
    const args = parseDiffSummaryArgs(['node', 'cli', 'a.env', 'b.env']);
    expect(args.showUnchanged).toBe(false);
  });

  it('parses --show-unchanged flag', () => {
    const args = parseDiffSummaryArgs(['node', 'cli', 'a.env', 'b.env', '--show-unchanged']);
    expect(args.showUnchanged).toBe(true);
  });

  it('parses --json flag', () => {
    const args = parseDiffSummaryArgs(['node', 'cli', 'a.env', 'b.env', '--json']);
    expect(args.outputJson).toBe(true);
  });
});

describe('runDiffSummaryCliWithArgs', () => {
  let fromFile: string;
  let toFile: string;

  beforeEach(() => {
    fromFile = writeTempEnv('API_URL=http://dev\nSHARED=same\nOLD=remove\n');
    toFile = writeTempEnv('API_URL=http://prod\nSHARED=same\nNEW=added\n');
  });

  afterEach(() => {
    [fromFile, toFile].forEach(f => { try { fs.unlinkSync(f); } catch {} });
  });

  it('prints usage when files missing', () => {
    const lines: string[] = [];
    runDiffSummaryCliWithArgs({ fromFile: '', toFile: '', showUnchanged: false, outputJson: false }, l => lines.push(l));
    expect(lines[0]).toContain('Usage');
  });

  it('prints error for missing fromFile', () => {
    const lines: string[] = [];
    runDiffSummaryCliWithArgs({ fromFile: '/nonexistent.env', toFile, showUnchanged: false, outputJson: false }, l => lines.push(l));
    expect(lines[0]).toContain('Error');
  });

  it('outputs formatted diff', () => {
    const lines: string[] = [];
    runDiffSummaryCliWithArgs({ fromFile, toFile, showUnchanged: false, outputJson: false }, l => lines.push(l));
    const output = lines.join('\n');
    expect(output).toContain('→');
    expect(output).toContain('+1');
  });

  it('outputs json when --json flag set', () => {
    const lines: string[] = [];
    runDiffSummaryCliWithArgs({ fromFile, toFile, showUnchanged: false, outputJson: true }, l => lines.push(l));
    const parsed = JSON.parse(lines.join('\n'));
    expect(parsed).toHaveProperty('addedCount');
    expect(parsed).toHaveProperty('entries');
  });

  it('shows unchanged keys when flag set', () => {
    const lines: string[] = [];
    runDiffSummaryCliWithArgs({ fromFile, toFile, showUnchanged: true, outputJson: false }, l => lines.push(l));
    const output = lines.join('\n');
    expect(output).toContain('SHARED');
  });
});
