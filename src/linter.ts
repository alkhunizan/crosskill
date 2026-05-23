import type { Skill } from "./schema.js";

export interface LintIssue {
  level: "error" | "warning" | "info";
  message: string;
  rule: string;
}

export interface LintConfig {
  minBodyLength: number;
  maxBodyLength: number;
  requireExamples: boolean;
}

export const DEFAULT_LINT_CONFIG: LintConfig = {
  minBodyLength: 80,
  maxBodyLength: 8000,
  requireExamples: true,
};

const VAGUE_VERBS = [
  "help",
  "assist",
  "try",
  "maybe",
  "perhaps",
  "should probably",
  "kind of",
  "sort of",
];

/**
 * Lint a parsed skill. Returns issues; an empty array means it's clean.
 */
export function lintSkill(skill: Skill, config: LintConfig = DEFAULT_LINT_CONFIG): LintIssue[] {
  const issues: LintIssue[] = [];
  const body = skill.body;
  const lower = body.toLowerCase();

  // Body length
  if (body.length < config.minBodyLength) {
    issues.push({
      level: "warning",
      rule: "min-body-length",
      message: `Skill body is only ${body.length} chars. Most useful skills are at least ${config.minBodyLength} chars.`,
    });
  }
  if (body.length > config.maxBodyLength) {
    issues.push({
      level: "warning",
      rule: "max-body-length",
      message: `Skill body is ${body.length} chars. Models truncate long instructions; consider splitting.`,
    });
  }

  // Examples
  if (config.requireExamples && !/##\s*examples?/i.test(body)) {
    issues.push({
      level: "warning",
      rule: "require-examples",
      message: "No `## Examples` section. Skills with worked examples produce far better outputs.",
    });
  }

  // Vague verbs
  for (const v of VAGUE_VERBS) {
    const re = new RegExp(`\\b${v}\\b`, "i");
    if (re.test(lower)) {
      issues.push({
        level: "info",
        rule: "vague-language",
        message: `Found vague language: "${v}". Prefer concrete verbs (e.g. "list", "output", "return").`,
      });
      break; // one warning per skill is enough
    }
  }

  // At least one target
  const anyTarget = Object.values(skill.frontmatter.targets ?? {}).some(Boolean);
  if (!anyTarget) {
    issues.push({
      level: "error",
      rule: "no-targets",
      message: "No targets enabled in front-matter. Set at least one of: claude, cursor, codex, ...",
    });
  }

  // Description quality
  const desc = skill.frontmatter.description;
  if (desc.length < 20) {
    issues.push({
      level: "info",
      rule: "short-description",
      message: "Description is very short. Longer descriptions help discovery in the registry.",
    });
  }

  return issues;
}
