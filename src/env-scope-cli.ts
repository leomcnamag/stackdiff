// env-scope-cli.ts — CLI interface for env-scope operations

import * as fs from 'fs';
import { parseEnvFile } from './parser';
import {
  extractScope,
  listScopes,
  partitionByScope,
  formatScopeSummary,
} from './env-scope';

export interface ScopeCliArgs {
  file: string;
  scope?: string;
  action: 'list' | 'extract' | 'summary';
}

export function parseScopeArgs(argv: string[]): ScopeCliArgs {
  const args: ScopeCliArgs = { file: '', action: 'list' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--file' || argv[i] === '-f') args.file = argv[++i];
    else if (argv[i] === '--scope' || argv[i] === '-s') args.scope = argv[++i];
    else if (argv[i] === '--action' || argv[i] === '-a')
      args.action = argv[++i] as ScopeCliArgs['action'];
  }
  return args;
}

export function runScopeCliWithArgs(argv: string[]): string {
  const args = parseScopeArgs(argv);

  if (!args.file) {
    return 'Error: --file is required';
  }
  if (!fs.existsSync(args.file)) {
    return `Error: file not found: ${args.file}`;
  }

  const content = fs.readFileSync(args.file, 'utf-8');
  const envMap = parseEnvFile(content);

  if (args.action === 'list') {
    const scopes = listScopes(envMap);
    if (scopes.length === 0) return 'No scopes found.';
    return `Scopes:\n${scopes.map((s) => `  ${s}`).join('\n')}`;
  }

  if (args.action === 'extract') {
    if (!args.scope) return 'Error: --scope is required for extract';
    const result = extractScope(envMap, args.scope);
    if (result.keys.length === 0) return `No keys found for scope: ${args.scope}`;
    return result.keys.map((k) => `${k}=${result.entries[k]}`).join('\n');
  }

  if (args.action === 'summary') {
    const partitioned = partitionByScope(envMap);
    return formatScopeSummary(partitioned);
  }

  return `Unknown action: ${args.action}`;
}

export function runScopeCli(): void {
  const output = runScopeCliWithArgs(process.argv.slice(2));
  console.log(output);
}
