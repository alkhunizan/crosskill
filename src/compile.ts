import { parseSkillString } from "./parser.js";
import { COMPILERS } from "./compilers/index.js";
import type { CompileResult, Skill, SupportedTarget } from "./schema.js";

/**
 * Compile a skill (parsed object or raw `*.skill.md` source string) to a
 * single target. Pure function — does not touch the filesystem.
 *
 * `outputRoot` is the conceptual root the compiler resolves paths against
 * (e.g. a repo root). Defaults to "." so the returned `outputPath` is
 * relative-ish and embedders that don't write to disk can ignore it.
 *
 * Throws if the target has no registered compiler (e.g. an unknown name).
 */
export function compileSkill(
  skill: Skill | string,
  target: SupportedTarget,
  outputRoot = "."
): CompileResult {
  const parsed = typeof skill === "string" ? parseSkillString(skill) : skill;
  const compiler = COMPILERS[target];
  if (!compiler) {
    throw new Error(
      `No compiler registered for target "${target}". Available: ${Object.entries(
        COMPILERS
      )
        .filter(([, c]) => c)
        .map(([k]) => k)
        .join(", ")}`
    );
  }
  return compiler.compile(parsed, outputRoot);
}

/**
 * Compile a skill to every target the skill's front-matter enables. Pure
 * function — does not touch the filesystem. Targets with no registered
 * compiler are silently skipped.
 *
 * Pass a string to compile from raw source; pass a `Skill` to skip re-parsing.
 */
export function compileSkillAll(
  skill: Skill | string,
  outputRoot = "."
): CompileResult[] {
  const parsed = typeof skill === "string" ? parseSkillString(skill) : skill;
  const enabled = parsed.frontmatter.targets ?? {};
  const results: CompileResult[] = [];
  for (const target of Object.keys(enabled) as SupportedTarget[]) {
    if (!enabled[target]) continue;
    const compiler = COMPILERS[target];
    if (!compiler) continue;
    results.push(compiler.compile(parsed, outputRoot));
  }
  return results;
}
