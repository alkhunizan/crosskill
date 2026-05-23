import { joinPath } from "../path-portable.js";
import type { Compiler, Skill, CompileResult } from "../schema.js";

/**
 * Aider compiler.
 *
 * Aider reads CONVENTIONS.md / read-only files and an .aider.conf.yml.
 * We emit a per-skill markdown file under .aider/skills/ and rely on the
 * user wiring it via "read" config. This is the lowest-friction approach.
 *
 * Output: .aider/skills/<name>.md
 */
export const aiderCompiler: Compiler = {
  target: "aider",
  defaultOutputPath: (name) => `.aider/skills/${name}.md`,
  compile(skill: Skill, outputRoot: string): CompileResult {
    const { name, description } = skill.frontmatter;
    const content = `# ${name}\n\n${description}\n\n${skill.body}\n`;
    const outputPath = joinPath(outputRoot, `.aider/skills/${name}.md`);
    return { target: "aider", outputPath, content };
  },
};
