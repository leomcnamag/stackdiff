import { formatDiff } from './formatter';
import { StageDiff } from './diff';

const sampleDiff: StageDiff = {
  stageA: 'staging',
  stageB: 'production',
  diffs: [
    { key: 'API_URL', status: 'changed', valueA: 'https://staging.api.com', valueB: 'https://api.com' },
    { key: 'DEBUG', status: 'removed', valueA: 'true', valueB: undefined },
    { key: 'NEW_RELIC_KEY', status: 'added', valueA: undefined, valueB: 'abc123' },
  ],
};

const emptyDiff: StageDiff = {
  stageA: 'dev',
  stageB: 'staging',
  diffs: [],
};

describe('formatDiff', () => {
  describe('json format', () => {
    it('returns valid JSON string', () => {
      const output = formatDiff(sampleDiff, 'json');
      expect(() => JSON.parse(output)).not.toThrow();
      const parsed = JSON.parse(output);
      expect(parsed.stageA).toBe('staging');
      expect(parsed.diffs).toHaveLength(3);
    });
  });

  describe('minimal format', () => {
    it('lists diffs one per line with status prefix', () => {
      const output = formatDiff(sampleDiff, 'minimal');
      expect(output).toContain('CHANGED API_URL');
      expect(output).toContain('REMOVED DEBUG');
      expect(output).toContain('ADDED NEW_RELIC_KEY');
    });

    it('returns no-differences message for empty diff', () => {
      const output = formatDiff(emptyDiff, 'minimal');
      expect(output).toContain('no differences');
    });
  });

  describe('table format', () => {
    it('includes stage names in header', () => {
      const output = formatDiff(sampleDiff, 'table');
      expect(output).toContain('staging');
      expect(output).toContain('production');
    });

    it('shows all diff keys', () => {
      const output = formatDiff(sampleDiff, 'table');
      expect(output).toContain('API_URL');
      expect(output).toContain('DEBUG');
      expect(output).toContain('NEW_RELIC_KEY');
    });

    it('shows no differences message for empty diff', () => {
      const output = formatDiff(emptyDiff, 'table');
      expect(output).toContain('No differences found');
    });

    it('defaults to table format', () => {
      const defaultOutput = formatDiff(sampleDiff);
      const tableOutput = formatDiff(sampleDiff, 'table');
      expect(defaultOutput).toBe(tableOutput);
    });
  });
});
