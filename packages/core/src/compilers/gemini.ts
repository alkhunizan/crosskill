import { join } from "node:path";
import type { Compiler, Skill, CompileResult } from "../schema.js";

/**
 * Gemini CLI compiler.
 *
 * Output: .gemini/skills/<name>.md
 */
export const geminiCompiler: Compiler = {
  target: "gemini",
  defaultOutputPath: (name) => `.gemini/skills/${name}.md`,
  compile(skill: Skill, outputRoot: string): CompileResult {
    const { name, description } = skill.frontmatter;
    const content = `# ${name}\n\n> ${description}\n\n${skill.body}\n`;
    const outputPath = join(outputRoot, `.gemini/skills/${name}.md`);
    return { target: "gemini", outputPath, content };
  },
};
