import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseRenameCliArgs, runRenameCliWithArgs } from './env-rename-cli';

function writeTempEnv(content: string): string {
  const file = path.join(os.tmpdir(), `stackdiff-rename-cli-${Date.now()}.env`);
  fs.writeFileSync(file, content, 'utf-8');
  return file;
}

describe('parseRenameCliArgs', () => {
  it('parses --input and --rule flags', () => {
    const args = parseRenameCliArgs(['--input', 'dev.env', '--rule', 'OLD=NEW']);
    expect(args.inputFile).toBe('dev.env');
    expect(args.rules).toEqual(['OLD=NEW']);
    expect(args.dryRun).toBe(false);
    expect(args.quiet).toBe(false);
  });

  it('parses short flags -i and -r', () => {
    const args = parseRenameCliArgs(['-i', 'prod.env', '-r', 'A=B', '-r', 'C=D']);
    expect(args.inputFile).toBe('prod.env');
    expect(args.rules).toEqual(['A=B', 'C=D']);
  });

  it('parses --dry-run and --quiet flags', () => {
    const args = parseRenameCliArgs(['--input', 'x.env', '--rule', 'A=B', '--dry-run', '--quiet']);
    expect(args.dryRun).toBe(true);
    expect(args.quiet).toBe(true);
  });

  it('parses --output flag', () => {
    const args = parseRenameCliArgs(['--input', 'a.env', '--rule', 'X=Y', '--output', 'out.env']);
    expect(args.outputFile).toBe('out.env');
  });
});

describe('runRenameCliWithArgs', () => {
  it('renames keys and returns formatted result', () => {
    const file = writeTempEnv('DB_HOST=localhost\nDB_PORT=5432\nAPI_KEY=secret\n');
    const output = runRenameCliWithArgs({
      inputFile: file,
      rules: ['DB_HOST=DATABASE_HOST', 'DB_PORT=DATABASE_PORT'],
      dryRun: true,
      quiet: false,
    });
    expect(output).toContain('DATABASE_HOST');
    expect(output).toContain('DATABASE_PORT');
    fs.unlinkSync(file);
  });

  it('returns empty string when quiet', () => {
    const file = writeTempEnv('FOO=bar\n');
    const output = runRenameCliWithArgs({
      inputFile: file,
      rules: ['FOO=BAR'],
      dryRun: true,
      quiet: true,
    });
    expect(output).toBe('');
    fs.unlinkSync(file);
  });

  it('throws when no input file provided', () => {
    expect(() =>
      runRenameCliWithArgs({ inputFile: '', rules: ['A=B'], dryRun: true, quiet: false })
    ).toThrow('--input file is required');
  });

  it('throws when no rules provided', () => {
    const file = writeTempEnv('FOO=bar\n');
    expect(() =>
      runRenameCliWithArgs({ inputFile: file, rules: [], dryRun: true, quiet: false })
    ).toThrow('At least one --rule is required');
    fs.unlinkSync(file);
  });

  it('writes output file when not dry-run', () => {
    const file = writeTempEnv('OLD_KEY=value\n');
    const outFile = path.join(os.tmpdir(), `stackdiff-rename-out-${Date.now()}.env`);
    runRenameCliWithArgs({
      inputFile: file,
      rules: ['OLD_KEY=NEW_KEY'],
      outputFile: outFile,
      dryRun: false,
      quiet: false,
    });
    const written = fs.readFileSync(outFile, 'utf-8');
    expect(written).toContain('NEW_KEY=value');
    fs.unlinkSync(file);
    fs.unlinkSync(outFile);
  });
});
