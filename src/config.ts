import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { LintConfig } from "./linter.js";
import type { SupportedTarget } from "./schema.js";
import { SNAPSHOTS_DIR } from "./snapshots.js";

/**
 * Canonical shape of `crosskill.config.json`. Every command reads through
 * this, so when a new top-level field is added it lives here and everyone
 * sees it.
 */
export interface CrosskillConfig {
  skillsDir: string;
  outputs?: Partial<Record<SupportedTarget, string>>;
  lint?: Partial<LintConfig>;
}

const DEFAULT_CONFIG: CrosskillConfig = { skillsDir: "./crosskill" };

export function loadConfig(cwd: string): CrosskillConfig {
  const configPath = join(cwd, "crosskill.config.json");
  if (!existsSync(configPath)) return DEFAULT_CONFIG;
  return JSON.parse(readFileSync(configPath, "utf8")) as CrosskillConfig;
}

/**
 * Walk `skillsDir` and return every `*.skill.md` and bare `skill.md` file
 * path, sorted. Skips the snapshots dir so test snapshots aren't mistaken
 * for skill sources. Returns `[]` when `skillsDir` doesn't exist (caller
 * prints the "run init" hint).
 */
export function findSkillFiles(skillsDir: string): string[] {
  if (!existsSync(skillsDir)) return [];
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (entry.name === SNAPSHOTS_DIR) continue;
        walk(join(dir, entry.name));
      } else if (
        entry.isFile() &&
        (entry.name.endsWith(".skill.md") || entry.name === "skill.md")
      ) {
        files.push(join(dir, entry.name));
      }
    }
  };
  walk(skillsDir);
  return files.sort();
}
