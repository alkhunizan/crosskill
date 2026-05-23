/**
 * Node-only entry for `@crosskill/core`.
 *
 * Re-exports the browser-safe main entry, plus the Node-only helpers that
 * need `fs` / `path` / `crypto` / `https` — config loading, lockfile, snapshot
 * IO, resolvers, runners, and the file-path variant of the parser.
 *
 * The CLI and desktop app import from here. The web app must import from
 * `@crosskill/core` (no `/node`) so its bundler doesn't pull these in.
 */
import { readFileSync } from "node:fs";
import { parseSkillString } from "./parser.js";
import type { Skill } from "./schema.js";

export * from "./index.js";

export function parseSkillFile(filePath: string): Skill {
  const raw = readFileSync(filePath, "utf8");
  return parseSkillString(raw, filePath);
}

export { loadConfig, findSkillFiles } from "./config.js";
export type { CrosskillConfig } from "./config.js";

export {
  sha256,
  toPosixPath,
  stringifyLockfile,
  readLockfile,
  writeLockfile,
  diffLockfiles,
  LOCKFILE_NAME,
  LOCKFILE_VERSION,
  CROSSKILL_VERSION,
} from "./lockfile.js";
export type {
  Lockfile,
  SkillLockEntry,
  AggregatedLockEntry,
  LockDrift,
} from "./lockfile.js";

export {
  SNAPSHOTS_DIR,
  readSnapshot,
  writeSnapshot,
  checkSnapshot,
  compactLineDiff,
  listExistingSnapshots,
} from "./snapshots.js";
export type {
  SnapshotKey,
  SnapshotStatus,
  SnapshotResult,
} from "./snapshots.js";

export { localResolver } from "./resolvers/local.js";
export { createGithubResolver, buildCandidateUrls } from "./resolvers/github.js";
export type { FetchLike } from "./resolvers/github.js";
export { parseRef } from "./resolvers/resolver.js";
export type {
  SkillResolver,
  ResolvedSkill,
  ParsedRef,
} from "./resolvers/resolver.js";

export { createOllamaRunner } from "./runners/ollama.js";
export type { EvalRunner } from "./runners/runner.js";
