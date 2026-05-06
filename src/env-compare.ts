import { EnvMap } from './parser';

export interface CompareResult {
  key: string;
  stages: Record<string, string | undefined>;
  status: 'consistent' | 'inconsistent' | 'missing';
}

export interface CompareReport {
  results: CompareResult[];
  consistent: string[];
  inconsistent: string[];
  missing: string[];
}

export function compareStages(
  stages: Record<string, EnvMap>
): CompareReport {
  const stageNames = Object.keys(stages);
  const allKeys = new Set<string>();
  for (const env of Object.values(stages)) {
    for (const key of Object.keys(env)) allKeys.add(key);
  }

  const results: CompareResult[] = [];
  const consistent: string[] = [];
  const inconsistent: string[] = [];
  const missing: string[] = [];

  for (const key of Array.from(allKeys).sort()) {
    const stageValues: Record<string, string | undefined> = {};
    for (const stage of stageNames) {
      stageValues[stage] = stages[stage][key];
    }

    const presentValues = Object.values(stageValues).filter(
      (v) => v !== undefined
    );
    const uniqueValues = new Set(presentValues);

    let status: CompareResult['status'];
    if (presentValues.length < stageNames.length) {
      status = 'missing';
      missing.push(key);
    } else if (uniqueValues.size === 1) {
      status = 'consistent';
      consistent.push(key);
    } else {
      status = 'inconsistent';
      inconsistent.push(key);
    }

    results.push({ key, stages: stageValues, status });
  }

  return { results, consistent, inconsistent, missing };
}

export function formatCompareReport(
  report: CompareReport,
  stageNames: string[]
): string {
  const lines: string[] = [];
  const header = ['KEY', ...stageNames, 'STATUS'].join('\t');
  lines.push(header);
  lines.push('-'.repeat(header.length + stageNames.length * 8));

  for (const result of report.results) {
    const values = stageNames.map((s) => result.stages[s] ?? '(missing)');
    const icon =
      result.status === 'consistent'
        ? '✓'
        : result.status === 'missing'
        ? '?'
        : '✗';
    lines.push([result.key, ...values, icon].join('\t'));
  }

  lines.push('');
  lines.push(
    `Summary: ${report.consistent.length} consistent, ` +
      `${report.inconsistent.length} inconsistent, ` +
      `${report.missing.length} missing`
  );

  return lines.join('\n');
}
