import * as fs from 'fs';
import * as path from 'path';
import { parseEnvFiles } from './parser';
import { diffStages } from './diff';
import { formatDiff } from './formatter';

export interface WatchOptions {
  files: string[];
  format?: 'table' | 'minimal' | 'json';
  debounceMs?: number;
  onchange?: (output: string) => void;
}

export interface WatchHandle {
  stop: () => void;
  isWatching: () => boolean;
}

export function watchEnvFiles(options: WatchOptions): WatchHandle {
  const { files, format = 'table', debounceMs = 300, onchange } = options;
  let watching = true;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  const watchers: fs.FSWatcher[] = [];

  const runDiff = () => {
    try {
      const envMaps = parseEnvFiles(files);
      const diffs = diffStages(envMaps);
      const output = formatDiff(diffs, format);
      if (onchange) {
        onchange(output);
      } else {
        console.clear();
        console.log('[stackdiff] watching for changes...\n');
        console.log(output);
      }
    } catch (err) {
      console.error('[stackdiff] error reading env files:', (err as Error).message);
    }
  };

  const scheduleRun = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(runDiff, debounceMs);
  };

  for (const file of files) {
    const dir = path.dirname(file);
    const base = path.basename(file);
    try {
      const watcher = fs.watch(dir, (event, filename) => {
        if (filename === base) scheduleRun();
      });
      watchers.push(watcher);
    } catch {
      console.warn(`[stackdiff] could not watch ${file}`);
    }
  }

  runDiff();

  return {
    stop: () => {
      watching = false;
      if (debounceTimer) clearTimeout(debounceTimer);
      watchers.forEach(w => w.close());
    },
    isWatching: () => watching,
  };
}
