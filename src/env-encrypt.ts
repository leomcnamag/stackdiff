import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

export function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return crypto.scryptSync(passphrase, salt, KEY_LENGTH);
}

export function encryptValue(value: string, passphrase: string): string {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(passphrase, salt);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}

export function decryptValue(encoded: string, passphrase: string): string {
  const buf = Buffer.from(encoded, 'base64');
  const salt = buf.subarray(0, 16);
  const iv = buf.subarray(16, 16 + IV_LENGTH);
  const tag = buf.subarray(16 + IV_LENGTH, 16 + IV_LENGTH + TAG_LENGTH);
  const encrypted = buf.subarray(16 + IV_LENGTH + TAG_LENGTH);
  const key = deriveKey(passphrase, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf8');
}

export function encryptEnvMap(
  env: Record<string, string>,
  passphrase: string,
  keys?: string[]
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(env)) {
    if (!keys || keys.includes(k)) {
      result[k] = 'enc:' + encryptValue(v, passphrase);
    } else {
      result[k] = v;
    }
  }
  return result;
}

export function decryptEnvMap(
  env: Record<string, string>,
  passphrase: string
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(env)) {
    if (v.startsWith('enc:')) {
      result[k] = decryptValue(v.slice(4), passphrase);
    } else {
      result[k] = v;
    }
  }
  return result;
}

export function isEncrypted(value: string): boolean {
  return value.startsWith('enc:');
}
