import { join } from "node:path";
import type { Compiler, Skill, CompileResult } from "../schema.js";

/**
 * Windsurf rules compiler.
 *
 * Output: .windsurf/rules/<name>.md
 */
export const windsurfCompiler: Compiler = {
  target: "windsurf",
  defaultOutputPath: (name) => `.windsurf/rules/${name}.md`,
  compile(skill: Skill, outputRoot: string): CompileResult {
    const { name, description } = skill.frontmatter;
    const content = `# ${name}\n\n> ${description}\n\n${skill.body}\n`;
    const outputPath = join(outputRoot, `.windsurf/rules/${name}.md`);
    return { target: "windsurf", outputPath, content };
  },
};
