import { joinPath } from "../path-portable.js";
import type { Compiler, Skill, CompileResult } from "../schema.js";

/**
 * Continue.dev compiler.
 *
 * Output: .continue/<name>.md (per-skill prompt file).
 * Continue reads prompt files from .continue/ for the @ palette.
 */
export const continueCompiler: Compiler = {
  target: "continue",
  defaultOutputPath: (name) => `.continue/${name}.md`,
  compile(skill: Skill, outputRoot: string): CompileResult {
    const { name, description } = skill.frontmatter;
    const content = `# ${name}\n\n> ${description}\n\n${skill.body}\n`;
    const outputPath = joinPath(outputRoot, `.continue/${name}.md`);
    return { target: "continue", outputPath, content };
  },
};
