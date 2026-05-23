import { z } from "zod";

/**
 * crosskill skill schema.
 *
 * A skill is a Markdown file with YAML front-matter. The front-matter
 * captures structured metadata; the body is the prompt / instructions
 * itself, written in Markdown.
 */

export const SUPPORTED_TARGETS = [
  "claude",
  "cursor",
  "codex",
  "windsurf",
  "aider",
  "opencode",
  "gemini",
  "copilot",
  "continue",
] as const;

export type SupportedTarget = (typeof SUPPORTED_TARGETS)[number];

const TargetsSchema = z
  .object({
    claude: z.boolean().optional(),
    cursor: z.boolean().optional(),
    codex: z.boolean().optional(),
    windsurf: z.boolean().optional(),
    aider: z.boolean().optional(),
    opencode: z.boolean().optional(),
    gemini: z.boolean().optional(),
    copilot: z.boolean().optional(),
    continue: z.boolean().optional(),
  })
  .default({});

export const SkillFrontmatterSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
      "name must be kebab-case (lowercase, digits, hyphens)"
    ),
  version: z
    .string()
    .regex(
      /^\d+\.\d+\.\d+(-[a-z0-9.-]+)?$/i,
      "version must be valid semver, e.g. 0.1.0"
    )
    .default("0.1.0"),
  description: z.string().min(8).max(240),
  author: z.string().optional(),
  tags: z.array(z.string()).default([]),
  license: z.string().default("MIT"),
  targets: TargetsSchema,
  tools: z.array(z.string()).optional(),
  inputs: z.array(z.string()).optional(),
  homepage: z.string().url().optional(),
});

export type SkillFrontmatter = z.infer<typeof SkillFrontmatterSchema>;

export interface Skill {
  frontmatter: SkillFrontmatter;
  body: string; // Markdown body, the actual prompt
  sourcePath?: string;
}

export interface CompileResult {
  target: SupportedTarget;
  outputPath: string;
  content: string;
  skipped?: boolean;
  reason?: string;
}

export interface Compiler {
  target: SupportedTarget;
  /** Where the compiled output goes, relative to repo root. */
  defaultOutputPath: (skillName: string) => string;
  /** Compile a single skill to this target. */
  compile: (skill: Skill, outputRoot: string) => CompileResult;
}
