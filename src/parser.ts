import matter from "gray-matter";
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { SkillFrontmatterSchema, type Skill } from "./schema.js";

/**
 * Parse a *.skill.md file into a Skill object.
 * Throws a readable error if the front-matter is invalid.
 */
export function parseSkillFile(filePath: string): Skill {
  const raw = readFileSync(filePath, "utf8");
  return parseSkillString(raw, filePath);
}

export function parseSkillString(raw: string, sourcePath?: string): Skill {
  const parsed = matter(raw);
  const result = SkillFrontmatterSchema.safeParse(parsed.data);

  if (!result.success) {
    const where = sourcePath ?? "<inline>";
    const fileName = sourcePath ? basename(sourcePath) : "<inline>";
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new SkillParseError(
      `Invalid front-matter in ${fileName}\n${issues}`,
      where
    );
  }

  const body = parsed.content.trim();
  if (!body) {
    throw new SkillParseError(
      `Skill body is empty in ${sourcePath ?? "<inline>"}. The body is the prompt itself.`,
      sourcePath ?? "<inline>"
    );
  }

  return {
    frontmatter: result.data,
    body,
    sourcePath,
  };
}

export class SkillParseError extends Error {
  constructor(
    message: string,
    public readonly source: string
  ) {
    super(message);
    this.name = "SkillParseError";
  }
}
