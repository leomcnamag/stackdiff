import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseMaskArgs, runMaskCliWithArgs } from './env-mask-cli';

function writeTempEnv(content: string): string {
  const file = path.join(os.tmpdir(), `mask-test-${Date.now()}.env`);
  fs.writeFileSync(file, content);
  return file;
}

describe('parseMaskArgs', () => {
  it('parses keys flag', () => {
    const args = parseMaskArgs(['--keys', 'API_KEY,SECRET']);
    expect(args.keys).toEqual(['API_KEY', 'SECRET']);
  });

  it('parses mode flag', () => {
    const args = parseMaskArgs(['--mode', 'full']);
    expect(args.mode).toBe('full');
  });

  it('parses visible flag', () => {
    const args = parseMaskArgs(['--visible', '6']);
    expect(args.visibleChars).toBe(6);
  });

  it('parses output flag', () => {
    const args = parseMaskArgs(['--output', '/tmp/out.env']);
    expect(args.output).toBe('/tmp/out.env');
  });

  it('parses summary flag', () => {
    const args = parseMaskArgs(['--summary']);
    expect(args.summary).toBe(true);
  });

  it('collects positional args as files', () => {
    const args = parseMaskArgs(['.env.dev', '.env.prod']);
    expect(args.files).toEqual(['.env.dev', '.env.prod']);
  });

  it('applies defaults', () => {
    const args = parseMaskArgs([]);
    expect(args.mode).toBe('partial');
    expect(args.char).toBe('*');
    expect(args.visibleChars).toBe(4);
    expect(args.summary).toBe(false);
  });
});

describe('runMaskCliWithArgs', () => {
  let tmpFile: string;

  afterEach(() => {
    if (tmpFile && fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  });

  it('masks specified keys and writes to stdout', () => {
    tmpFile = writeTempEnv('API_KEY=supersecret\nPORT=3000\n');
    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((m) => logs.push(m));

    runMaskCliWithArgs({
      files: [tmpFile],
      keys: ['API_KEY'],
      mode: 'full',
      char: '*',
      visibleChars: 4,
      summary: false,
    });

    expect(logs.join('\n')).toContain('API_KEY=***********');
    expect(logs.join('\n')).toContain('PORT=3000');
    jest.restoreAllMocks();
  });

  it('writes output to file when --output is specified', () => {
    tmpFile = writeTempEnv('SECRET=abc123\n');
    const outFile = path.join(os.tmpdir(), `mask-out-${Date.now()}.env`);

    runMaskCliWithArgs({
      files: [tmpFile],
      keys: ['SECRET'],
      mode: 'full',
      char: '*',
      visibleChars: 4,
      output: outFile,
      summary: false,
    });

    const content = fs.readFileSync(outFile, 'utf-8');
    expect(content).toContain('SECRET=******');
    fs.unlinkSync(outFile);
  });

  it('exits with error when no files given', () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => runMaskCliWithArgs({ files: [], keys: ['K'], mode: 'full', char: '*', visibleChars: 4, summary: false })).toThrow();
    mockExit.mockRestore();
    jest.restoreAllMocks();
  });
});
