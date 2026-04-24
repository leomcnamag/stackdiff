import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const CLI = path.resolve(__dirname, '../src/cli.ts');
const RUN = (args: string) =>
  execSync(`npx ts-node ${CLI} ${args}`, { encoding: 'utf-8' });

function writeTempEnv(content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stackdiff-'));
  const file = path.join(dir, '.env.test');
  fs.writeFileSync(file, content);
  return file;
}

describe('cli compare', () => {
  let fileA: string;
  let fileB: string;

  beforeAll(() => {
    fileA = writeTempEnv('DB_HOST=localhost\nDB_PORT=5432\nAPP_ENV=development\n');
    fileB = writeTempEnv('DB_HOST=prod.db.example.com\nDB_PORT=5432\nAPP_ENV=production\nNEW_KEY=added\n');
  });

  afterAll(() => {
    fs.rmSync(path.dirname(fileA), { recursive: true });
    fs.rmSync(path.dirname(fileB), { recursive: true });
  });

  it('outputs table format by default', () => {
    const output = RUN(`compare ${fileA} ${fileB}`);
    expect(output).toBeTruthy();
  });

  it('outputs json format when --format json', () => {
    const output = RUN(`compare --format json ${fileA} ${fileB}`);
    expect(() => JSON.parse(output)).not.toThrow();
    const parsed = JSON.parse(output);
    expect(Array.isArray(parsed)).toBe(true);
  });

  it('outputs minimal format when --format minimal', () => {
    const output = RUN(`compare --format minimal ${fileA} ${fileB}`);
    expect(output.length).toBeGreaterThan(0);
  });

  it('accepts --stages to override stage names', () => {
    const output = RUN(`compare --stages dev,prod --format json ${fileA} ${fileB}`);
    const parsed = JSON.parse(output);
    const stages: string[] = parsed.flatMap((d: { stages: string[] }) => d.stages);
    expect(stages).toContain('dev');
    expect(stages).toContain('prod');
  });

  it('exits with code 1 when stage count mismatches file count', () => {
    expect(() => {
      RUN(`compare --stages dev,staging,prod ${fileA} ${fileB}`);
    }).toThrow();
  });

  it('prints no differences message when files are identical', () => {
    const output = RUN(`compare ${fileA} ${fileA}`);
    expect(output).toContain('No differences found');
  });
});
