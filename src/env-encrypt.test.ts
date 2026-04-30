import {
  encryptValue,
  decryptValue,
  encryptEnvMap,
  decryptEnvMap,
  isEncrypted,
} from './env-encrypt';

const PASSPHRASE = 'test-secret-passphrase-123';

describe('encryptValue / decryptValue', () => {
  it('round-trips a simple string', () => {
    const original = 'my-secret-value';
    const encrypted = encryptValue(original, PASSPHRASE);
    expect(encrypted).not.toBe(original);
    expect(decryptValue(encrypted, PASSPHRASE)).toBe(original);
  });

  it('produces different ciphertext each call (random IV)', () => {
    const a = encryptValue('hello', PASSPHRASE);
    const b = encryptValue('hello', PASSPHRASE);
    expect(a).not.toBe(b);
  });

  it('throws on wrong passphrase', () => {
    const encrypted = encryptValue('secret', PASSPHRASE);
    expect(() => decryptValue(encrypted, 'wrong-passphrase')).toThrow();
  });

  it('handles empty string', () => {
    const encrypted = encryptValue('', PASSPHRASE);
    expect(decryptValue(encrypted, PASSPHRASE)).toBe('');
  });
});

describe('isEncrypted', () => {
  it('returns true for enc:-prefixed values', () => {
    const enc = 'enc:' + encryptValue('val', PASSPHRASE);
    expect(isEncrypted(enc)).toBe(true);
  });

  it('returns false for plain values', () => {
    expect(isEncrypted('plaintext')).toBe(false);
  });
});

describe('encryptEnvMap', () => {
  const env = { API_KEY: 'abc123', DB_PASS: 'secret', APP_NAME: 'myapp' };

  it('encrypts all keys when no filter provided', () => {
    const result = encryptEnvMap(env, PASSPHRASE);
    expect(result.API_KEY).toMatch(/^enc:/);
    expect(result.DB_PASS).toMatch(/^enc:/);
    expect(result.APP_NAME).toMatch(/^enc:/);
  });

  it('encrypts only specified keys', () => {
    const result = encryptEnvMap(env, PASSPHRASE, ['API_KEY', 'DB_PASS']);
    expect(result.API_KEY).toMatch(/^enc:/);
    expect(result.DB_PASS).toMatch(/^enc:/);
    expect(result.APP_NAME).toBe('myapp');
  });
});

describe('decryptEnvMap', () => {
  it('decrypts enc:-prefixed values and leaves others unchanged', () => {
    const env = { API_KEY: 'abc123', DB_PASS: 'secret', APP_NAME: 'myapp' };
    const encrypted = encryptEnvMap(env, PASSPHRASE, ['API_KEY', 'DB_PASS']);
    const decrypted = decryptEnvMap(encrypted, PASSPHRASE);
    expect(decrypted).toEqual(env);
  });

  it('round-trips a fully encrypted map', () => {
    const env = { X: 'foo', Y: 'bar' };
    const enc = encryptEnvMap(env, PASSPHRASE);
    const dec = decryptEnvMap(enc, PASSPHRASE);
    expect(dec).toEqual(env);
  });
});
