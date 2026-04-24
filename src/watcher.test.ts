import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { watchEnvFiles } from './watcher';

function writeTempEnv(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

describe('watchEnvFiles', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stackdiff-watch-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('calls onchange with initial diff output', (done) => {
    const f1 = writeTempEnv(tmpDir, '.env.dev', 'KEY=dev\nSHARED=yes');
    const f2 = writeTempEnv(tmpDir, '.env.prod', 'KEY=prod\nSHARED=yes');

    const handle = watchEnvFiles({
      files: [f1, f2],
      format: 'minimal',
      debounceMs: 50,
      onchange: (output) => {
        expect(typeof output).toBe('string');
        expect(output.length).toBeGreaterThan(0);
        handle.stop();
        done();
      },
    });
  });

  it('returns a handle with stop and isWatching', () => {
    const f1 = writeTempEnv(tmpDir, '.env.staging', 'A=1');
    const handle = watchEnvFiles({
      files: [f1],
      onchange: () => {},
    });
    expect(handle.isWatching()).toBe(true);
    handle.stop();
    expect(handle.isWatching()).toBe(false);
  });

  it('triggers onchange when a file is modified', (done) => {
    const f1 = writeTempEnv(tmpDir, '.env.dev', 'KEY=dev');
    const f2 = writeTempEnv(tmpDir, '.env.prod', 'KEY=prod');
    let callCount = 0;

    const handle = watchEnvFiles({
      files: [f1, f2],
      format: 'json',
      debounceMs: 80,
      onchange: (output) => {
        callCount++;
        if (callCount === 2) {
          expect(output).toContain('KEY');
          handle.stop();
          done();
        }
      },
    });

    setTimeout(() => {
      fs.writeFileSync(f1, 'KEY=dev\nNEW=added', 'utf-8');
    }, 120);
  }, 5000);
});
