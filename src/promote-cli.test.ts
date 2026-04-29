import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { parsePromoteArgs, runPromoteCli } from './promote-cli';

function writeTempEnv(content: string): string {
  const file = path.join(os.tmpdir(), `promote-test-${Date.now()}-${Math.random()}.env`);
  fs.writeFileSync(file, content);
  return file;
}

describe('parsePromoteArgs', () => {
  it('parses source and target files', () => {
    const args = parsePromoteArgs(['src.env', 'tgt.env']);
    expect(args.sourceFile).toBe('src.env');
    expect(args.targetFile).toBe('tgt.env');
  });

  it('parses --overwrite flag', () => {
    const args = parsePromoteArgs(['src.env', 'tgt.env', '--overwrite']);
    expect(args.overwrite).toBe(true);
  });

  it('parses --dry-run flag', () => {
    const args = parsePromoteArgs(['src.env', 'tgt.env', '--dry-run']);
    expect(args.dryRun).toBe(true);
  });

  it('parses --keys option', () => {
    const args = parsePromoteArgs(['src.env', 'tgt.env', '--keys', 'A,B,C']);
    expect(args.keys).toEqual(['A', 'B', 'C']);
  });

  it('parses --output json', () => {
    const args = parsePromoteArgs(['src.env', 'tgt.env', '--output', 'json']);
    expect(args.output).toBe('json');
  });

  it('defaults overwrite and dryRun to false', () => {
    const args = parsePromoteArgs(['src.env', 'tgt.env']);
    expect(args.overwrite).toBe(false);
    expect(args.dryRun).toBe(false);
  });
});

describe('runPromoteCli', () => {
  let src: string;
  let tgt: string;

  beforeEach(() => {
    src = writeTempEnv('API_URL=https://prod\nSECRET=abc');
    tgt = writeTempEnv('API_URL=https://staging\nDB=localhost');
  });

  afterEach(() => {
    [src, tgt].forEach(f => { try { fs.unlinkSync(f); } catch {} });
  });

  it('prints text output by default', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    runPromoteCli([src, tgt]);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('prints JSON when --output json is passed', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    runPromoteCli([src, tgt, '--output', 'json']);
    const output = spy.mock.calls[0][0];
    expect(() => JSON.parse(output)).not.toThrow();
    spy.mockRestore();
  });

  it('prints dry run notice with --dry-run', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    runPromoteCli([src, tgt, '--dry-run']);
    const allOutput = spy.mock.calls.map(c => c[0]).join('\n');
    expect(allOutput).toContain('dry run');
    spy.mockRestore();
  });
});
