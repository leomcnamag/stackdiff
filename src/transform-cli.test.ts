import fs from 'fs';
import os from 'os';
import path from 'path';
import { parseTransformArgs, serializeEnv, runTransformCli } from './transform-cli';

function writeTempEnv(content: string): string {
  const p = path.join(os.tmpdir(), `transform-test-${Date.now()}.env`);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

afterEach(() => {
  // temp files cleaned up by OS
});

describe('parseTransformArgs', () => {
  it('parses --prefix', () => {
    const args = parseTransformArgs(['--input', 'a.env', '--prefix', 'APP_']);
    expect(args.rules).toEqual([{ type: 'prefix', value: 'APP_' }]);
    expect(args.input).toBe('a.env');
  });

  it('parses --rename with colon syntax', () => {
    const args = parseTransformArgs(['--input', 'a.env', '--rename', 'OLD:NEW']);
    expect(args.rules[0]).toEqual({ type: 'rename', from: 'OLD', to: 'NEW' });
  });

  it('parses --replace with colon syntax', () => {
    const args = parseTransformArgs(['--input', 'a.env', '--replace', 'localhost:prod']);
    expect(args.rules[0]).toEqual({ type: 'replace', from: 'localhost', to: 'prod' });
  });

  it('parses --uppercase and --lowercase flags', () => {
    const args = parseTransformArgs(['--input', 'x.env', '--uppercase', '--lowercase']);
    expect(args.rules).toEqual([{ type: 'uppercase' }, { type: 'lowercase' }]);
  });

  it('defaults format to env', () => {
    const args = parseTransformArgs(['--input', 'x.env']);
    expect(args.format).toBe('env');
  });

  it('parses --format json', () => {
    const args = parseTransformArgs(['--input', 'x.env', '--format', 'json']);
    expect(args.format).toBe('json');
  });
});

describe('serializeEnv', () => {
  it('produces KEY=VALUE lines', () => {
    const out = serializeEnv({ A: '1', B: '2' });
    expect(out).toContain('A=1');
    expect(out).toContain('B=2');
  });
});

describe('runTransformCli', () => {
  it('writes transformed output to file', () => {
    const inp = writeTempEnv('KEY=hello\nOTHER=world');
    const out = path.join(os.tmpdir(), `transform-out-${Date.now()}.env`);
    runTransformCli(['--input', inp, '--uppercase', '--output', out]);
    const content = fs.readFileSync(out, 'utf8');
    expect(content).toContain('KEY=HELLO');
    fs.unlinkSync(inp);
    fs.unlinkSync(out);
  });

  it('exits on missing --input', () => {
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => runTransformCli([])).toThrow('exit');
    exit.mockRestore();
  });
});
