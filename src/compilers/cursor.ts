import { join } from "node:path";
import type { Compiler, Skill, CompileResult } from "../schema.js";

/**
 * Cursor rules compiler.
 *
 * Output: .cursor/rules/<name>.mdc
 * Cursor uses .mdc files (Markdown with front-matter) for rules.
 */
export const cursorCompiler: Compiler = {
  target: "cursor",
  defaultOutputPath: (name) => `.cursor/rules/${name}.mdc`,
  compile(skill: Skill, outputRoot: string): CompileResult {
    const { name, description } = skill.frontmatter;

    // Cursor recognises `description` and optional `globs` / `alwaysApply`.
    const frontmatter = [
      "---",
      `description: ${JSON.stringify(description)}`,
      `alwaysApply: false`,
      "---",
      "",
    ].join("\n");

    const content = `${frontmatter}# ${name}\n\n${skill.body}\n`;
    const outputPath = join(outputRoot, `.cursor/rules/${name}.mdc`);

    return { target: "cursor", outputPath, content };
  },
};
