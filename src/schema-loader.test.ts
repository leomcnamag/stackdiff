import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { loadSchema, saveSchema } from './schema-loader';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stackdiff-schema-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('loadSchema', () => {
  it('loads a valid schema file', () => {
    const schemaPath = path.join(tmpDir, 'schema.json');
    const raw = {
      DATABASE_URL: { required: true, description: 'DB URL' },
      PORT: { required: true, pattern: '^\\d+$' },
    };
    fs.writeFileSync(schemaPath, JSON.stringify(raw));
    const schema = loadSchema(schemaPath);
    expect(schema.DATABASE_URL.required).toBe(true);
    expect(schema.PORT.pattern).toBe('^\\d+$');
  });

  it('throws if file does not exist', () => {
    expect(() => loadSchema(path.join(tmpDir, 'missing.json'))).toThrow('not found');
  });

  it('throws on invalid JSON', () => {
    const schemaPath = path.join(tmpDir, 'bad.json');
    fs.writeFileSync(schemaPath, 'not json');
    expect(() => loadSchema(schemaPath)).toThrow('Failed to parse');
  });

  it('throws if schema is not an object', () => {
    const schemaPath = path.join(tmpDir, 'arr.json');
    fs.writeFileSync(schemaPath, JSON.stringify([1, 2, 3]));
    expect(() => loadSchema(schemaPath)).toThrow('must be a JSON object');
  });

  it('defaults required to false if not set', () => {
    const schemaPath = path.join(tmpDir, 'schema.json');
    fs.writeFileSync(schemaPath, JSON.stringify({ KEY: {} }));
    const schema = loadSchema(schemaPath);
    expect(schema.KEY.required).toBe(false);
  });
});

describe('saveSchema', () => {
  it('saves and reloads a schema', () => {
    const schemaPath = path.join(tmpDir, 'out.json');
    const schema = { API_KEY: { required: true, pattern: '^[A-Z]+$' } };
    saveSchema(schemaPath, schema);
    const loaded = loadSchema(schemaPath);
    expect(loaded.API_KEY.required).toBe(true);
    expect(loaded.API_KEY.pattern).toBe('^[A-Z]+$');
  });
});
