/**
 * Load and parse an EnvSchema from a JSON file.
 */

import * as fs from 'fs';
import * as path from 'path';
import { EnvSchema, SchemaField } from './schema';

export function loadSchema(schemaPath: string): EnvSchema {
  const resolved = path.resolve(schemaPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Schema file not found: ${resolved}`);
  }
  const raw = fs.readFileSync(resolved, 'utf-8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Failed to parse schema JSON: ${resolved}`);
  }
  return normalizeSchema(parsed);
}

function normalizeSchema(raw: unknown): EnvSchema {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('Schema must be a JSON object mapping key names to field definitions.');
  }
  const schema: EnvSchema = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value !== 'object' || value === null) {
      throw new Error(`Schema field "${key}" must be an object.`);
    }
    const field = value as Record<string, unknown>;
    const schemaField: SchemaField = {
      required: field.required === true,
    };
    if (typeof field.description === 'string') schemaField.description = field.description;
    if (typeof field.pattern === 'string') schemaField.pattern = field.pattern;
    schema[key] = schemaField;
  }
  return schema;
}

export function saveSchema(schemaPath: string, schema: EnvSchema): void {
  const resolved = path.resolve(schemaPath);
  fs.writeFileSync(resolved, JSON.stringify(schema, null, 2) + '\n', 'utf-8');
}
