import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { SupportedTarget } from "./schema.js";

export const SNAPSHOTS_DIR = "__snapshots__";

export interface SnapshotKey {
  skill: string;
  target: SupportedTarget;
}

export type SnapshotStatus = "match" | "drift" | "missing" | "written";

export interface SnapshotResult {
  key: SnapshotKey;
  status: SnapshotStatus;
  /** When status === "drift": the on-disk snapshot. */
  expected?: string;
  /** When status === "drift": what the compiler produced just now. */
  actual?: string;
}

function snapshotPath(skillsDir: string, key: SnapshotKey): string {
  return join(skillsDir, SNAPSHOTS_DIR, key.skill, `${key.target}.txt`);
}

export function readSnapshot(skillsDir: string, key: SnapshotKey): string | null {
  const p = snapshotPath(skillsDir, key);
  if (!existsSync(p)) return null;
  return readFileSync(p, "utf8");
}

export function writeSnapshot(skillsDir: string, key: SnapshotKey, content: string): void {
  const p = snapshotPath(skillsDir, key);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content, "utf8");
}

/**
 * Compare `actual` (just-compiled) to the on-disk snapshot.
 *
 * - `update === true` always writes and returns `{ status: "written" }`.
 * - Snapshot missing + `update === false` → `{ status: "missing" }` (caller
 *   should fail loudly so CI catches new skills without snapshots).
 * - Snapshot present + identical → `{ status: "match" }`.
 * - Snapshot present + different → `{ status: "drift", expected, actual }`.
 */
export function checkSnapshot(
  skillsDir: string,
  key: SnapshotKey,
  actual: string,
  update: boolean
): SnapshotResult {
  if (update) {
    writeSnapshot(skillsDir, key, actual);
    return { key, status: "written" };
  }
  const expected = readSnapshot(skillsDir, key);
  if (expected === null) {
    return { key, status: "missing" };
  }
  if (expected === actual) {
    return { key, status: "match" };
  }
  return { key, status: "drift", expected, actual };
}

/**
 * Tiny line-by-line diff for human-readable drift reporting. Not as good as
 * a real LCS diff but cheap and obvious for the kind of small snapshots
 * compiler output produces. Use for CLI messages only.
 */
export function compactLineDiff(expected: string, actual: string, maxLines = 6): string {
  const eLines = expected.split("\n");
  const aLines = actual.split("\n");
  const n = Math.max(eLines.length, aLines.length);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    if (eLines[i] !== aLines[i]) {
      if (eLines[i] !== undefined) out.push(`  - ${eLines[i]}`);
      if (aLines[i] !== undefined) out.push(`  + ${aLines[i]}`);
      if (out.length >= maxLines) {
        out.push(`  ... (truncated)`);
        break;
      }
    }
  }
  return out.join("\n");
}

/**
 * Find every snapshot file on disk under `skillsDir/__snapshots__/`.
 * Returns `{ skill, target }` keys derived from the directory + filename.
 * Used to detect snapshots that no longer have a corresponding skill (i.e.
 * the skill was renamed/deleted and the snapshot is now stale).
 */
export function listExistingSnapshots(skillsDir: string): SnapshotKey[] {
  const root = join(skillsDir, SNAPSHOTS_DIR);
  if (!existsSync(root)) return [];
  const out: SnapshotKey[] = [];
  for (const skillEntry of readdirSync(root, { withFileTypes: true })) {
    if (!skillEntry.isDirectory()) continue;
    const skillName = skillEntry.name;
    const skillDir = join(root, skillName);
    for (const fileEntry of readdirSync(skillDir, { withFileTypes: true })) {
      if (!fileEntry.isFile() || !fileEntry.name.endsWith(".txt")) continue;
      const target = fileEntry.name.replace(/\.txt$/, "") as SupportedTarget;
      out.push({ skill: skillName, target });
    }
  }
  return out;
}
