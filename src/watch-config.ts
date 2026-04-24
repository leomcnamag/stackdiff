export interface WatchConfig {
  debounceMs: number;
  format: 'table' | 'minimal' | 'json';
  clearOnChange: boolean;
  showTimestamp: boolean;
}

const VALID_FORMATS = ['table', 'minimal', 'json'] as const;

export function defaultWatchConfig(): WatchConfig {
  return {
    debounceMs: 300,
    format: 'table',
    clearOnChange: true,
    showTimestamp: true,
  };
}

export function parseWatchConfig(raw: Record<string, unknown>): WatchConfig {
  const config = defaultWatchConfig();

  if (typeof raw.debounceMs === 'number' && raw.debounceMs >= 0) {
    config.debounceMs = raw.debounceMs;
  }

  if (typeof raw.format === 'string' && (VALID_FORMATS as readonly string[]).includes(raw.format)) {
    config.format = raw.format as WatchConfig['format'];
  }

  if (typeof raw.clearOnChange === 'boolean') {
    config.clearOnChange = raw.clearOnChange;
  }

  if (typeof raw.showTimestamp === 'boolean') {
    config.showTimestamp = raw.showTimestamp;
  }

  return config;
}

export function formatTimestamp(date: Date = new Date()): string {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}
