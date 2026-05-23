import { joinPath } from "../path-portable.js";
import type { Compiler, Skill, CompileResult } from "../schema.js";

/**
 * OpenCode compiler.
 *
 * Output: .opencode/skills/<name>.md
 */
export const opencodeCompiler: Compiler = {
  target: "opencode",
  defaultOutputPath: (name) => `.opencode/skills/${name}.md`,
  compile(skill: Skill, outputRoot: string): CompileResult {
    const { name, description } = skill.frontmatter;
    const fm = [
      "---",
      `name: ${name}`,
      `description: ${JSON.stringify(description)}`,
      "---",
      "",
    ].join("\n");
    const content = `${fm}${skill.body}\n`;
    const outputPath = joinPath(outputRoot, `.opencode/skills/${name}.md`);
    return { target: "opencode", outputPath, content };
  },
};
