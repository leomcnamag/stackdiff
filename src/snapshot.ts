import * as fs from 'fs';
import * as path from 'path';
import { EnvMap } from './parser';

export interface Snapshot {
  timestamp: string;
  stage: string;
  vars: EnvMap;
}

export interface SnapshotIndex {
  snapshots: Array<{ file: string; timestamp: string; stage: string }>;
}

export function saveSnapshot(stage: string, vars: EnvMap, dir: string): string {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${stage}_${timestamp}.json`;
  const filepath = path.join(dir, filename);
  const snapshot: Snapshot = { timestamp, stage, vars };
  fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2));
  updateIndex(dir, filename, timestamp, stage);
  return filepath;
}

export function loadSnapshot(filepath: string): Snapshot {
  const raw = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(raw) as Snapshot;
}

export function listSnapshots(dir: string, stage?: string): Snapshot[] {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'index.json');
  return files
    .map(f => loadSnapshot(path.join(dir, f)))
    .filter(s => !stage || s.stage === stage)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function updateIndex(dir: string, file: string, timestamp: string, stage: string): void {
  const indexPath = path.join(dir, 'index.json');
  let index: SnapshotIndex = { snapshots: [] };
  if (fs.existsSync(indexPath)) {
    index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  }
  index.snapshots.push({ file, timestamp, stage });
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
}
