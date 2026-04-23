import * as fs from "fs";
import * as path from "path";

export type EnvMap = Record<string, string>;

export interface ParseResult {
  filePath: string;
  stage: string;
  vars: EnvMap;
}

/**
 * Parses a .env file into a key-value map.
 * Ignores comment lines (starting with #) and blank lines.
 */
export function parseEnvFile(filePath: string): EnvMap {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  const content = fs.readFileSync(absolutePath, "utf-8");
  const result: EnvMap = {};

  for (const raw of content.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;

    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    const value = line
      .slice(eqIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");

    if (key) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Derives a stage name from a file path.
 * e.g. ".env.production" => "production", ".env" => "default"
 */
export function stageFromPath(filePath: string): string {
  const base = path.basename(filePath);
  const match = base.match(/^\.env\.?(.*)$/);
  if (!match) return base;
  return match[1] || "default";
}

export function parseEnvFiles(filePaths: string[]): ParseResult[] {
  return filePaths.map((fp) => ({
    filePath: fp,
    stage: stageFromPath(fp),
    vars: parseEnvFile(fp),
  }));
}
