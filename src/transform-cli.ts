/**
 * transform-cli.ts — CLI interface for the transform module
 */

import fs from 'fs';
import { parseEnvFile } from './parser';
import { transformEnvMap, TransformRule } from './transform';

export interface TransformArgs {
  input: string;
  rules: TransformRule[];
  output?: string;
  format: 'env' | 'json';
}

export function parseTransformArgs(argv: string[]): TransformArgs {
  const args: TransformArgs = { input: '', rules: [], format: 'env' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--input' || a === '-i') args.input = argv[++i];
    else if (a === '--output' || a === '-o') args.output = argv[++i];
    else if (a === '--format') args.format = argv[++i] as 'env' | 'json';
    else if (a === '--prefix') args.rules.push({ type: 'prefix', value: argv[++i] });
    else if (a === '--suffix') args.rules.push({ type: 'suffix', value: argv[++i] });
    else if (a === '--uppercase') args.rules.push({ type: 'uppercase' });
    else if (a === '--lowercase') args.rules.push({ type: 'lowercase' });
    else if (a === '--rename') {
      const [from, to] = argv[++i].split(':');
      args.rules.push({ type: 'rename', from, to });
    } else if (a === '--replace') {
      const [from, to] = argv[++i].split(':');
      args.rules.push({ type: 'replace', from, to });
    }
  }
  return args;
}

export function serializeEnv(env: Record<string, string>): string {
  return Object.entries(env)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
}

export function runTransformCli(argv: string[]): void {
  const args = parseTransformArgs(argv);
  if (!args.input) {
    console.error('Error: --input is required');
    process.exit(1);
  }
  const raw = fs.readFileSync(args.input, 'utf8');
  const env = parseEnvFile(raw);
  const transformed = transformEnvMap(env, args.rules);
  const out =
    args.format === 'json'
      ? JSON.stringify(transformed, null, 2)
      : serializeEnv(transformed);
  if (args.output) {
    fs.writeFileSync(args.output, out, 'utf8');
    console.log(`Written to ${args.output}`);
  } else {
    console.log(out);
  }
}
