import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;

export function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return crypto.scryptSync(passphrase, salt, KEY_LENGTH);
}

export function encryptValue(value: string, passphrase: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(passphrase, salt);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}

export function decryptValue(encoded: string, passphrase: string): string {
  const buf = Buffer.from(encoded, 'base64');
  if (buf.length < SALT_LENGTH + IV_LENGTH + TAG_LENGTH) {
    throw new Error('Encrypted value is too short or corrupted');
  }
  const salt = buf.subarray(0, SALT_LENGTH);
  const iv = buf.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = buf.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = buf.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const key = deriveKey(passphrase, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  try {
    return decipher.update(encrypted) + decipher.final('utf8');
  } catch {
    throw new Error('Decryption failed: invalid passphrase or corrupted data');
  }
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
