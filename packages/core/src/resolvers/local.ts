import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseRef, type ResolvedSkill, type SkillResolver } from "./resolver.js";

/**
 * Resolve a bundled starter skill from `./skills/<name>/skill.md`. The same
 * candidate-path dance the original `add` command did, so this works in both
 * `dist/` (published) and `src/` (dev) layouts.
 */
export const localResolver: SkillResolver = {
  name: "local",
  canResolve(ref) {
    return parseRef(ref)?.kind === "local";
  },
  async resolve(ref) {
    const parsed = parseRef(ref);
    if (parsed?.kind !== "local") throw new Error(`local resolver: not a local ref: ${ref}`);
    const here = dirname(fileURLToPath(import.meta.url));
    // Skills live in the sibling `@crosskill/skills` workspace package; the
    // resolver itself may be running from any of `packages/core/src/resolvers/`
    // (dev), `packages/core/dist/` (bundled), or `node_modules/@crosskill/core/dist/`
    // (installed). Try each layout in turn.
    const candidates = [
      // packages/core/src/resolvers/local.ts → ../../../skills/<name>/skill.md
      join(here, "..", "..", "..", "skills", parsed.name, "skill.md"),
      // packages/core/dist/node.js → ../../skills/<name>/skill.md
      join(here, "..", "..", "skills", parsed.name, "skill.md"),
      // node_modules/@crosskill/core/dist/node.js → ../../skills/<name>/skill.md
      join(here, "..", "..", "..", "@crosskill", "skills", parsed.name, "skill.md"),
      // Legacy pre-monorepo layouts (kept so existing dist outputs still work)
      join(here, "..", "..", "skills", parsed.name, "skill.md"),
      join(here, "..", "skills", parsed.name, "skill.md"),
    ];
    const sourcePath = candidates.find(existsSync);
    if (!sourcePath) {
      throw new Error(
        `Starter skill "${parsed.name}" not found. Looked in:\n  ${candidates.join("\n  ")}`
      );
    }
    const content = readFileSync(sourcePath, "utf8");
    return { content, source: `local: ${parsed.name}` } satisfies ResolvedSkill;
  },
};
