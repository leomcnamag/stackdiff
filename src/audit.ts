/**
 * audit.ts
 * Tracks changes to environment variables over time, producing an audit trail
 * of who changed what and when (based on snapshot history).
 */

import * as fs from "fs";
import * as path from "path";
import { loadSnapshot, listSnapshots } from "./snapshot";
import { diffEnvMaps } from "./diff";

export interface AuditEntry {
  timestamp: string;
  stage: string;
  added: string[];
  removed: string[];
  changed: string[];
  snapshotId: string;
}

export interface AuditReport {
  stage: string;
  entries: AuditEntry[];
  totalChanges: number;
}

/**
 * Build an audit trail for a given stage by diffing consecutive snapshots.
 */
export function buildAuditTrail(stage: string, snapshotDir: string): AuditReport {
  const ids = listSnapshots(snapshotDir).filter((id) => id.includes(stage));

  if (ids.length === 0) {
    return { stage, entries: [], totalChanges: 0 };
  }

  // Sort snapshot IDs chronologically (they are timestamp-prefixed)
  const sorted = [...ids].sort();

  const entries: AuditEntry[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const prevSnap = loadSnapshot(sorted[i - 1], snapshotDir);
    const currSnap = loadSnapshot(sorted[i], snapshotDir);

    if (!prevSnap || !currSnap) continue;

    const diff = diffEnvMaps(prevSnap.env, currSnap.env);

    const added = Object.keys(diff).filter((k) => diff[k].status === "added");
    const removed = Object.keys(diff).filter((k) => diff[k].status === "removed");
    const changed = Object.keys(diff).filter((k) => diff[k].status === "changed");

    if (added.length + removed.length + changed.length === 0) continue;

    entries.push({
      timestamp: currSnap.timestamp,
      stage,
      added,
      removed,
      changed,
      snapshotId: sorted[i],
    });
  }

  const totalChanges = entries.reduce(
    (sum, e) => sum + e.added.length + e.removed.length + e.changed.length,
    0
  );

  return { stage, entries, totalChanges };
}

/**
 * Format an audit report as a human-readable string.
 */
export function formatAuditReport(report: AuditReport): string {
  const lines: string[] = [];

  lines.push(`Audit Trail — Stage: ${report.stage}`);
  lines.push(`${"-".repeat(50)}`);

  if (report.entries.length === 0) {
    lines.push("No changes recorded.");
    return lines.join("\n");
  }

  for (const entry of report.entries) {
    lines.push(`\n[${entry.timestamp}] Snapshot: ${entry.snapshotId}`);
    if (entry.added.length > 0) {
      lines.push(`  + Added:   ${entry.added.join(", ")}`);
    }
    if (entry.removed.length > 0) {
      lines.push(`  - Removed: ${entry.removed.join(", ")}`);
    }
    if (entry.changed.length > 0) {
      lines.push(`  ~ Changed: ${entry.changed.join(", ")}`);
    }
  }

  lines.push(`\nTotal changes: ${report.totalChanges} across ${report.entries.length} snapshot(s).`);
  return lines.join("\n");
}
