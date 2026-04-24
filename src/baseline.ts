import * as fs from 'fs';
import * as path from 'path';
import { EnvMap } from './parser';

export interface Baseline {
  name: string;
  stage: string;
  vars: EnvMap;
  createdAt: string;
}

export interface BaselineIndex {
  baselines: Array<{ name: string; stage: string; file: string; createdAt: string }>;
}

const BASELINE_DIR = '.stackdiff/baselines';
const INDEX_FILE = path.join(BASELINE_DIR, 'index.json');

export function ensureBaselineDir(): void {
  if (!fs.existsSync(BASELINE_DIR)) {
    fs.mkdirSync(BASELINE_DIR, { recursive: true });
  }
}

export function saveBaseline(name: string, stage: string, vars: EnvMap): Baseline {
  ensureBaselineDir();
  const baseline: Baseline = {
    name,
    stage,
    vars,
    createdAt: new Date().toISOString(),
  };
  const file = path.join(BASELINE_DIR, `${name}.json`);
  fs.writeFileSync(file, JSON.stringify(baseline, null, 2));
  updateBaselineIndex(name, stage, file, baseline.createdAt);
  return baseline;
}

export function loadBaseline(name: string): Baseline | null {
  const file = path.join(BASELINE_DIR, `${name}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf-8')) as Baseline;
}

export function listBaselines(): BaselineIndex['baselines'] {
  if (!fs.existsSync(INDEX_FILE)) return [];
  const index: BaselineIndex = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
  return index.baselines;
}

export function deleteBaseline(name: string): boolean {
  const file = path.join(BASELINE_DIR, `${name}.json`);
  if (!fs.existsSync(file)) return false;
  fs.unlinkSync(file);
  const index = listBaselines().filter((b) => b.name !== name);
  fs.writeFileSync(INDEX_FILE, JSON.stringify({ baselines: index }, null, 2));
  return true;
}

function updateBaselineIndex(name: string, stage: string, file: string, createdAt: string): void {
  const existing = listBaselines().filter((b) => b.name !== name);
  existing.push({ name, stage, file, createdAt });
  fs.writeFileSync(INDEX_FILE, JSON.stringify({ baselines: existing }, null, 2));
}
