import { maskValue, maskEnvMap, maskStages, formatMaskSummary } from './env-mask';

describe('maskValue', () => {
  it('full mode masks entire value', () => {
    expect(maskValue('secret123', { mode: 'full' })).toBe('*********');
  });

  it('length mode returns fixed 8 stars', () => {
    expect(maskValue('abc', { mode: 'length' })).toBe('********');
    expect(maskValue('averylongvalue', { mode: 'length' })).toBe('********');
  });

  it('partial mode shows last N chars', () => {
    const result = maskValue('mypassword', { mode: 'partial', visibleChars: 3 });
    expect(result).toBe('*******ord');
  });

  it('partial mode with short value shows no chars', () => {
    const result = maskValue('ab', { mode: 'partial', visibleChars: 4 });
    expect(result).toBe('**');
  });

  it('defaults to partial mode', () => {
    const result = maskValue('password1234');
    expect(result).toMatch(/^\*+\d{4}$/);
  });

  it('returns empty string unchanged', () => {
    expect(maskValue('')).toBe('');
  });

  it('supports custom mask char', () => {
    expect(maskValue('secret', { mode: 'full', char: '#' })).toBe('######');
  });
});

describe('maskEnvMap', () => {
  const env = { API_KEY: 'abc123', DB_URL: 'postgres://host', PORT: '3000' };

  it('masks specified keys only', () => {
    const result = maskEnvMap(env, ['API_KEY', 'DB_URL'], { mode: 'full' });
    expect(result.API_KEY).toBe('******');
    expect(result.DB_URL).toBe('***************');
    expect(result.PORT).toBe('3000');
  });

  it('returns unchanged map when no keys specified', () => {
    const result = maskEnvMap(env, []);
    expect(result).toEqual(env);
  });
});

describe('maskStages', () => {
  const stages = {
    dev: { SECRET: 'devsecret', PORT: '3000' },
    prod: { SECRET: 'prodsecret', PORT: '8080' },
  };

  it('masks keys across all stages', () => {
    const result = maskStages(stages, ['SECRET'], { mode: 'full' });
    expect(result.dev.SECRET).toBe('*********');
    expect(result.prod.SECRET).toBe('**********');
    expect(result.dev.PORT).toBe('3000');
    expect(result.prod.PORT).toBe('8080');
  });
});

describe('formatMaskSummary', () => {
  it('reports masked keys', () => {
    const original = { API_KEY: 'secret', PORT: '3000' };
    const masked = { API_KEY: '**cret', PORT: '3000' };
    const summary = formatMaskSummary(original, masked);
    expect(summary).toContain('Masked 1 key(s)');
    expect(summary).toContain('API_KEY');
  });

  it('reports zero masked keys', () => {
    const env = { PORT: '3000' };
    const summary = formatMaskSummary(env, env);
    expect(summary).toContain('Masked 0 key(s)');
  });
});
