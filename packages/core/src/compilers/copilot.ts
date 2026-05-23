import { join } from "node:path";
import type { Compiler, Skill, CompileResult } from "../schema.js";

/**
 * GitHub Copilot Workspace compiler.
 *
 * Output: .github/copilot-instructions.md (single file, multiple skills
 * appended as sections — build.ts aggregates).
 */
export const copilotCompiler: Compiler = {
  target: "copilot",
  defaultOutputPath: () => ".github/copilot-instructions.md",
  compile(skill: Skill, outputRoot: string): CompileResult {
    const { name, description } = skill.frontmatter;

    const content = [
      `## ${name}`,
      "",
      `> ${description}`,
      "",
      skill.body.trim(),
      "",
    ].join("\n");

    const outputPath = join(outputRoot, ".github/copilot-instructions.md");
    return { target: "copilot", outputPath, content };
  },
};
