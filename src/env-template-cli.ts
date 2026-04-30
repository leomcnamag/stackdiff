import * as fs from 'fs';
import * as path from 'path';
import { parseEnvFiles } from './parser';
import { renderEnvTemplate, renderStageTemplates } from './env-template';

export interface TemplateCliArgs {
  files: string[];
  context?: string;
  stage?: string;
  output: 'text' | 'json';
}

export function parseTemplateArgs(argv: string[]): TemplateCliArgs {
  const args: TemplateCliArgs = { files: [], output: 'text' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--context' && argv[i + 1]) args.context = argv[++i];
    else if (argv[i] === '--stage' && argv[i + 1]) args.stage = argv[++i];
    else if (argv[i] === '--json') args.output = 'json';
    else if (!argv[i].startsWith('--')) args.files.push(argv[i]);
  }
  return args;
}

export function runTemplateCliWithArgs(args: TemplateCliArgs): string {
  if (args.files.length === 0) return 'Error: no env files provided';

  const stages = parseEnvFiles(args.files);
  let sharedContext: Record<string, string> = {};

  if (args.context && fs.existsSync(args.context)) {
    const raw = fs.readFileSync(args.context, 'utf-8');
    for (const line of raw.split('\n')) {
      const eq = line.indexOf('=');
      if (eq > 0) sharedContext[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
    }
  }

  const results = renderStageTemplates(stages, sharedContext);
  const target = args.stage ? { [args.stage]: results[args.stage] } : results;

  if (args.output === 'json') return JSON.stringify(target, null, 2);

  const lines: string[] = [];
  for (const [stage, result] of Object.entries(target)) {
    if (!result) { lines.push(`Stage "${stage}" not found`); continue; }
    lines.push(`=== ${stage} (${result.substitutions} substitution(s)) ===`);
    for (const [k, v] of Object.entries(result.rendered)) lines.push(`  ${k}=${v}`);
    if (result.missing.length > 0) lines.push(`  [missing: ${result.missing.join(', ')}]`);
  }
  return lines.join('\n');
}

export function runTemplateCli(argv: string[]): void {
  const args = parseTemplateArgs(argv);
  console.log(runTemplateCliWithArgs(args));
}
