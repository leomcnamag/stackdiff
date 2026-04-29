/**
 * CLI entry point for schema validation subcommand.
 * Usage: stackdiff schema --schema <path> [env files...]
 */

import * as fs from 'fs';
import { parseEnvFiles } from './parser';
import { loadSchema } from './schema-loader';
import { validateAgainstSchema, formatSchemaResult } from './schema';

export interface SchemaCliArgs {
  schemaPath: string;
  envPaths: string[];
}

export function parseSchemaArgs(argv: string[]): SchemaCliArgs {
  const schemaIdx = argv.indexOf('--schema');
  if (schemaIdx === -1 || !argv[schemaIdx + 1]) {
    throw new Error('Usage: stackdiff schema --schema <schema.json> [env files...]');
  }
  const schemaPath = argv[schemaIdx + 1];
  const envPaths = argv.filter((_, i) => i !== schemaIdx && i !== schemaIdx + 1 && argv[i] !== 'schema');
  if (envPaths.length === 0) {
    throw new Error('At least one env file must be provided.');
  }
  return { schemaPath, envPaths };
}

export async function runSchemaCli(argv: string[]): Promise<void> {
  let args: SchemaCliArgs;
  try {
    args = parseSchemaArgs(argv);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }

  let schema;
  try {
    schema = loadSchema(args.schemaPath);
  } catch (err) {
    console.error(`Schema load error: ${(err as Error).message}`);
    process.exit(1);
  }

  const missing = args.envPaths.filter(p => !fs.existsSync(p));
  if (missing.length > 0) {
    console.error(`File(s) not found: ${missing.join(', ')}`);
    process.exit(1);
  }

  const stages = parseEnvFiles(args.envPaths);
  const result = validateAgainstSchema(stages, schema);
  process.stdout.write(formatSchemaResult(result));

  if (!result.valid) process.exit(2);
}
