import { defaultWatchConfig, parseWatchConfig, formatTimestamp } from './watch-config';

describe('defaultWatchConfig', () => {
  it('returns sensible defaults', () => {
    const cfg = defaultWatchConfig();
    expect(cfg.debounceMs).toBe(300);
    expect(cfg.format).toBe('table');
    expect(cfg.clearOnChange).toBe(true);
    expect(cfg.showTimestamp).toBe(true);
  });
});

describe('parseWatchConfig', () => {
  it('overrides debounceMs when valid', () => {
    const cfg = parseWatchConfig({ debounceMs: 500 });
    expect(cfg.debounceMs).toBe(500);
  });

  it('ignores negative debounceMs', () => {
    const cfg = parseWatchConfig({ debounceMs: -1 });
    expect(cfg.debounceMs).toBe(300);
  });

  it('accepts valid format values', () => {
    expect(parseWatchConfig({ format: 'minimal' }).format).toBe('minimal');
    expect(parseWatchConfig({ format: 'json' }).format).toBe('json');
    expect(parseWatchConfig({ format: 'table' }).format).toBe('table');
  });

  it('ignores invalid format values', () => {
    const cfg = parseWatchConfig({ format: 'xml' });
    expect(cfg.format).toBe('table');
  });

  it('overrides boolean flags', () => {
    const cfg = parseWatchConfig({ clearOnChange: false, showTimestamp: false });
    expect(cfg.clearOnChange).toBe(false);
    expect(cfg.showTimestamp).toBe(false);
  });

  it('returns defaults for empty input', () => {
    const cfg = parseWatchConfig({});
    expect(cfg).toEqual(defaultWatchConfig());
  });
});

describe('formatTimestamp', () => {
  it('formats a date as YYYY-MM-DD HH:MM:SS', () => {
    const date = new Date('2024-06-15T10:30:45.000Z');
    const result = formatTimestamp(date);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it('uses current time when no date provided', () => {
    const result = formatTimestamp();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });
});
