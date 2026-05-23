import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { SupportedTarget } from "./schema.js";

export const LOCKFILE_NAME = "crosskill.lock";
export const LOCKFILE_VERSION = 1;

/**
 * The crosskill package version, written into every lockfile. Bump in lockstep
 * with `package.json` — single source of truth would be nice but pulling
 * package.json into the bundle is more trouble than it's worth.
 */
export const CROSSKILL_VERSION = "0.4.0";

/**
 * Lockfile schema (v1).
 *
 * Per-skill `sourceHash` covers the raw `*.skill.md` file bytes.
 * Per-output `contentHash` covers the bytes the compiler emitted for that
 * target. Aggregated targets (e.g. AGENTS.md, copilot-instructions.md) get a
 * top-level entry in `aggregated` with a hash over the combined file.
 *
 * No timestamps — same input must produce byte-identical lockfiles.
 */
export interface SkillLockEntry {
  version: string;
  sourceHash: string;
  outputs: Record<string, { path: string; contentHash: string }>;
}

export interface AggregatedLockEntry {
  path: string;
  contentHash: string;
  sections: number;
}

export interface Lockfile {
  lockfileVersion: number;
  crosskillVersion: string;
  skills: Record<string, SkillLockEntry>;
  aggregated: Partial<Record<SupportedTarget, AggregatedLockEntry>>;
}

export function sha256(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("hex");
}

/** Normalise to POSIX paths so lockfiles diff cleanly across OSes. */
export function toPosixPath(p: string): string {
  return p.replace(/\\/g, "/");
}

/**
 * Serialise the lockfile deterministically: sorted skill keys, sorted output
 * keys within each skill, sorted aggregated keys. Trailing newline.
 */
export function stringifyLockfile(lock: Lockfile): string {
  const sortedSkills: Record<string, SkillLockEntry> = {};
  for (const name of Object.keys(lock.skills).sort()) {
    const entry = lock.skills[name]!;
    const sortedOutputs: SkillLockEntry["outputs"] = {};
    for (const target of Object.keys(entry.outputs).sort()) {
      sortedOutputs[target] = entry.outputs[target]!;
    }
    sortedSkills[name] = {
      version: entry.version,
      sourceHash: entry.sourceHash,
      outputs: sortedOutputs,
    };
  }
  const sortedAggregated: Lockfile["aggregated"] = {};
  for (const target of (Object.keys(lock.aggregated) as SupportedTarget[]).sort()) {
    sortedAggregated[target] = lock.aggregated[target];
  }
  const ordered: Lockfile = {
    lockfileVersion: lock.lockfileVersion,
    crosskillVersion: lock.crosskillVersion,
    skills: sortedSkills,
    aggregated: sortedAggregated,
  };
  return JSON.stringify(ordered, null, 2) + "\n";
}

export function readLockfile(cwd: string): Lockfile | null {
  const path = join(cwd, LOCKFILE_NAME);
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, "utf8");
    const parsed = JSON.parse(raw) as Lockfile;
    if (parsed.lockfileVersion !== LOCKFILE_VERSION) {
      throw new Error(
        `crosskill.lock has lockfileVersion ${parsed.lockfileVersion}, expected ${LOCKFILE_VERSION}. Regenerate with \`crosskill build\`.`
      );
    }
    return parsed;
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error(`crosskill.lock is not valid JSON: ${err.message}`);
    }
    throw err;
  }
}

export function writeLockfile(cwd: string, lock: Lockfile): void {
  writeFileSync(join(cwd, LOCKFILE_NAME), stringifyLockfile(lock), "utf8");
}

export interface LockDrift {
  kind:
    | "missing-skill"
    | "extra-skill"
    | "source-hash"
    | "missing-output"
    | "extra-output"
    | "output-hash"
    | "missing-aggregated"
    | "extra-aggregated"
    | "aggregated-hash";
  skill?: string;
  target?: string;
  message: string;
}

/**
 * Compare `current` (just computed) to `locked` (read from disk).
 * Returns drift items; empty array means the lockfile is up to date.
 */
export function diffLockfiles(current: Lockfile, locked: Lockfile): LockDrift[] {
  const drift: LockDrift[] = [];

  const currentSkills = new Set(Object.keys(current.skills));
  const lockedSkills = new Set(Object.keys(locked.skills));

  for (const name of lockedSkills) {
    if (!currentSkills.has(name)) {
      drift.push({
        kind: "missing-skill",
        skill: name,
        message: `skill "${name}" is in lockfile but no longer in skillsDir`,
      });
    }
  }
  for (const name of currentSkills) {
    if (!lockedSkills.has(name)) {
      drift.push({
        kind: "extra-skill",
        skill: name,
        message: `skill "${name}" exists but is not in lockfile — run \`crosskill build\``,
      });
      continue;
    }
    const a = current.skills[name]!;
    const b = locked.skills[name]!;
    if (a.sourceHash !== b.sourceHash) {
      drift.push({
        kind: "source-hash",
        skill: name,
        message: `skill "${name}" source has changed since the lockfile was written`,
      });
    }
    const currentOuts = new Set(Object.keys(a.outputs));
    const lockedOuts = new Set(Object.keys(b.outputs));
    for (const t of lockedOuts) {
      if (!currentOuts.has(t)) {
        drift.push({
          kind: "missing-output",
          skill: name,
          target: t,
          message: `skill "${name}" no longer targets "${t}" — run \`crosskill build\``,
        });
      }
    }
    for (const t of currentOuts) {
      if (!lockedOuts.has(t)) {
        drift.push({
          kind: "extra-output",
          skill: name,
          target: t,
          message: `skill "${name}" now targets "${t}" — run \`crosskill build\``,
        });
        continue;
      }
      if (a.outputs[t]!.contentHash !== b.outputs[t]!.contentHash) {
        drift.push({
          kind: "output-hash",
          skill: name,
          target: t,
          message: `skill "${name}" output for "${t}" has drifted from lockfile`,
        });
      }
    }
  }

  const currentAgg = Object.keys(current.aggregated) as SupportedTarget[];
  const lockedAgg = Object.keys(locked.aggregated) as SupportedTarget[];
  for (const t of lockedAgg) {
    if (!current.aggregated[t]) {
      drift.push({
        kind: "missing-aggregated",
        target: t,
        message: `aggregated output for "${t}" is in lockfile but not in current build`,
      });
    }
  }
  for (const t of currentAgg) {
    if (!locked.aggregated[t]) {
      drift.push({
        kind: "extra-aggregated",
        target: t,
        message: `aggregated output for "${t}" exists but is not in lockfile — run \`crosskill build\``,
      });
      continue;
    }
    if (current.aggregated[t]!.contentHash !== locked.aggregated[t]!.contentHash) {
      drift.push({
        kind: "aggregated-hash",
        target: t,
        message: `aggregated output for "${t}" has drifted from lockfile`,
      });
    }
  }

  return drift;
}
