import { parseSkillString, SkillParseError } from "./parser.js";
import { COMPILERS } from "./compilers/index.js";
import { DEFAULT_LINT_CONFIG, lintSkill, type LintConfig, type LintIssue } from "./linter.js";
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

/**
 * Preview result — shape designed for editor integrations. One call returns
 * everything needed to render a live multi-target preview alongside warnings:
 * parse status, lint issues, and compiled outputs for every enabled target.
 *
 * - When the buffer doesn't parse, `skill` is `undefined`, `parseError` is
 *   populated, `lintIssues` is empty, and `compiled` is empty.
 * - When the buffer parses, `skill` is populated, `parseError` is `undefined`,
 *   `lintIssues` reflects the linter result, and `compiled` has one entry per
 *   enabled-and-registered target.
 *
 * Pure function — does not touch the filesystem, no network, no surprises.
 */
export interface PreviewResult {
  skill?: Skill;
  parseError?: SkillParseError | Error;
  lintIssues: LintIssue[];
  compiled: CompileResult[];
}

export interface PreviewOptions {
  /** Lint config override. Defaults to crosskill's `DEFAULT_LINT_CONFIG`. */
  lintConfig?: LintConfig;
  /**
   * Restrict compilation to a subset of targets. Useful for the editor's
   * preview pane — render only the tab the user is looking at. Defaults to
   * "every target the skill's front-matter enables".
   */
  onlyTargets?: SupportedTarget[];
  /** Conceptual output root for the compilers. Defaults to ".". */
  outputRoot?: string;
}

/**
 * Compile a buffer-style skill source for an editor preview. One call,
 * everything an integrator needs.
 *
 * @example
 * const preview = compileSkillForPreview(editor.getValue(), {
 *   onlyTargets: [activeTab],
 * });
 * if (preview.parseError) {
 *   showInlineError(preview.parseError.message);
 *   return;
 * }
 * renderLintGutter(preview.lintIssues);
 * for (const result of preview.compiled) {
 *   tabs[result.target].setText(result.content);
 * }
 */
export function compileSkillForPreview(
  source: string,
  opts: PreviewOptions = {}
): PreviewResult {
  let skill: Skill;
  try {
    skill = parseSkillString(source);
  } catch (err) {
    return {
      parseError: err instanceof Error ? err : new Error(String(err)),
      lintIssues: [],
      compiled: [],
    };
  }

  const lintIssues = lintSkill(skill, opts.lintConfig ?? DEFAULT_LINT_CONFIG);
  const enabled = skill.frontmatter.targets ?? {};
  const wantedTargets = opts.onlyTargets
    ? new Set(opts.onlyTargets)
    : null;
  const outputRoot = opts.outputRoot ?? ".";
  const compiled: CompileResult[] = [];

  for (const target of Object.keys(enabled) as SupportedTarget[]) {
    if (!enabled[target]) continue;
    if (wantedTargets && !wantedTargets.has(target)) continue;
    const compiler = COMPILERS[target];
    if (!compiler) continue;
    compiled.push(compiler.compile(skill, outputRoot));
  }

  return { skill, lintIssues, compiled };
}
