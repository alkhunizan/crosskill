// Public library API for consumers who want to embed crosskill in their own tools.
export { parseSkillFile, parseSkillString, SkillParseError } from "./parser.js";
export { lintSkill, DEFAULT_LINT_CONFIG } from "./linter.js";
export type { LintIssue, LintConfig } from "./linter.js";
export { COMPILERS, getCompiler } from "./compilers/index.js";
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
} from "./schema.js";
