import { joinPath } from "../path-portable.js";
import type { Compiler, Skill, CompileResult } from "../schema.js";

/**
 * AGENTS.md compiler (Codex / OpenAI Agents / OpenCode / others).
 *
 * Output: AGENTS.md (single file, multiple skills appended as sections)
 * Reference: https://agents.md
 *
 * Note: build.ts handles aggregation across skills so each "compile" returns
 * a section; the build step concatenates them with a header.
 */
export const codexCompiler: Compiler = {
  target: "codex",
  defaultOutputPath: () => "AGENTS.md",
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

    const outputPath = joinPath(outputRoot, "AGENTS.md");
    return { target: "codex", outputPath, content };
  },
};
