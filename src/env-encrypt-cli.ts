import * as fs from 'fs';
import * as path from 'path';
import { encryptEnvMap, decryptEnvMap } from './env-encrypt';
import { parseEnvFile } from './parser';

export interface EncryptCliArgs {
  mode: 'encrypt' | 'decrypt';
  inputFile: string;
  outputFile?: string;
  password: string;
  inPlace: boolean;
}

export function parseEncryptArgs(argv: string[]): EncryptCliArgs {
  const args = argv.slice(2);
  const mode = args[0] === 'decrypt' ? 'decrypt' : 'encrypt';
  let inputFile = '';
  let outputFile: string | undefined;
  let password = '';
  let inPlace = false;

  for (let i = 1; i < args.length; i++) {
    if ((args[i] === '--file' || args[i] === '-f') && args[i + 1]) {
      inputFile = args[++i];
    } else if ((args[i] === '--output' || args[i] === '-o') && args[i + 1]) {
      outputFile = args[++i];
    } else if ((args[i] === '--password' || args[i] === '-p') && args[i + 1]) {
      password = args[++i];
    } else if (args[i] === '--in-place' || args[i] === '-i') {
      inPlace = true;
    }
  }

  if (!inputFile) throw new Error('Missing required --file argument');
  if (!password) throw new Error('Missing required --password argument');

  return { mode, inputFile, outputFile, password, inPlace };
}

export async function runEncryptCli(argv: string[]): Promise<void> {
  const args = parseEncryptArgs(argv);
  const raw = fs.readFileSync(args.inputFile, 'utf-8');
  const envMap = parseEnvFile(raw);

  const result =
    args.mode === 'encrypt'
      ? await encryptEnvMap(envMap, args.password)
      : await decryptEnvMap(envMap, args.password);

  const lines = Object.entries(result)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const dest = args.inPlace
    ? args.inputFile
    : args.outputFile ?? path.join(path.dirname(args.inputFile), `${args.mode}ed.env`);

  fs.writeFileSync(dest, lines + '\n', 'utf-8');
  console.log(`[stackdiff] ${args.mode}ed env written to ${dest}`);
}
