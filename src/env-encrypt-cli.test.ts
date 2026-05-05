import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseEncryptArgs, runEncryptCli } from './env-encrypt-cli';

function writeTempEnv(content: string): string {
  const file = path.join(os.tmpdir(), `stackdiff-enc-test-${Date.now()}.env`);
  fs.writeFileSync(file, content, 'utf-8');
  return file;
}

afterEach(() => {
  // cleanup handled per test
});

describe('parseEncryptArgs', () => {
  it('defaults mode to encrypt', () => {
    const args = parseEncryptArgs(['node', 'cli', '--file', 'x.env', '--password', 'secret']);
    expect(args.mode).toBe('encrypt');
  });

  it('parses decrypt mode', () => {
    const args = parseEncryptArgs(['node', 'cli', 'decrypt', '--file', 'x.env', '--password', 'secret']);
    expect(args.mode).toBe('decrypt');
  });

  it('parses --in-place flag', () => {
    const args = parseEncryptArgs(['node', 'cli', '--file', 'x.env', '--password', 'pw', '--in-place']);
    expect(args.inPlace).toBe(true);
  });

  it('throws when --file is missing', () => {
    expect(() => parseEncryptArgs(['node', 'cli', '--password', 'pw'])).toThrow('--file');
  });

  it('throws when --password is missing', () => {
    expect(() => parseEncryptArgs(['node', 'cli', '--file', 'x.env'])).toThrow('--password');
  });

  it('parses --output option', () => {
    const args = parseEncryptArgs(['node', 'cli', '--file', 'x.env', '--password', 'pw', '--output', 'out.env']);
    expect(args.outputFile).toBe('out.env');
  });
});

describe('runEncryptCli', () => {
  it('encrypts env file and writes output', async () => {
    const src = writeTempEnv('API_KEY=hello\nDB_PASS=world\n');
    const out = src.replace('.env', '-out.env');
    try {
      await runEncryptCli(['node', 'cli', 'encrypt', '--file', src, '--password', 'testpass', '--output', out]);
      expect(fs.existsSync(out)).toBe(true);
      const content = fs.readFileSync(out, 'utf-8');
      expect(content).toContain('API_KEY=');
      expect(content).not.toContain('hello');
    } finally {
      fs.rmSync(src, { force: true });
      fs.rmSync(out, { force: true });
    }
  });

  it('round-trips encrypt then decrypt', async () => {
    const src = writeTempEnv('SECRET=mysecretvalue\n');
    const enc = src.replace('.env', '-enc.env');
    const dec = src.replace('.env', '-dec.env');
    try {
      await runEncryptCli(['node', 'cli', 'encrypt', '--file', src, '--password', 'roundtrip', '--output', enc]);
      await runEncryptCli(['node', 'cli', 'decrypt', '--file', enc, '--password', 'roundtrip', '--output', dec]);
      const result = fs.readFileSync(dec, 'utf-8');
      expect(result).toContain('SECRET=mysecretvalue');
    } finally {
      [src, enc, dec].forEach(f => fs.rmSync(f, { force: true }));
    }
  });
});
