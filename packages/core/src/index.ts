// Browser-safe public API for `@crosskill/core`.
//
// Anything here must work in a bundler that targets the browser — no `fs`,
// no `path`, no `crypto`, no `https`. The Node-side surface (parseSkillFile,
// config, lockfile, snapshots, resolvers, runners) lives in
// `@crosskill/core/node`.
export { parseSkillString, SkillParseError } from "./parser.js";
export { lintSkill, DEFAULT_LINT_CONFIG } from "./linter.js";
export type { LintIssue, LintConfig } from "./linter.js";
export { COMPILERS, getCompiler } from "./compilers/index.js";
export { compileSkill, compileSkillAll, compileSkillForPreview } from "./compile.js";
export type { PreviewResult, PreviewOptions } from "./compile.js";
export {
  SkillFrontmatterSchema,
  SUPPORTED_TARGETS,
} from "./schema.js";
export type {
  Skill,
  SkillFrontmatter,
  SupportedTarget,
  Compiler,
  CompileResult,
  SkillExample,
} from "./schema.js";
