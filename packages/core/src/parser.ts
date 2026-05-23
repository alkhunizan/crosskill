import matter from "gray-matter";
import { SkillFrontmatterSchema, type Skill } from "./schema.js";

/**
 * Parse a `*.skill.md` source string into a Skill object.
 *
 * This is the browser-safe entry — no `fs`, no `path`. It powers the web
 * playground and any embedder that already has the file content in memory.
 *
 * The Node-side `parseSkillFile(path)` wrapper lives in `@crosskill/core/node`.
 */
export function parseSkillString(raw: string, sourcePath?: string): Skill {
  const parsed = matter(raw);
  const result = SkillFrontmatterSchema.safeParse(parsed.data);

  if (!result.success) {
    const where = sourcePath ?? "<inline>";
    const fileName = sourcePath ? basenamePortable(sourcePath) : "<inline>";
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

function basenamePortable(filePath: string): string {
  const i = Math.max(filePath.lastIndexOf("/"), filePath.lastIndexOf("\\"));
  return i >= 0 ? filePath.slice(i + 1) : filePath;
}
