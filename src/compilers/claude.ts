import { join } from "node:path";
import type { Compiler, Skill, CompileResult } from "../schema.js";

/**
 * Claude Code skill compiler.
 *
 * Output: .claude/skills/<name>/SKILL.md
 * Reference: https://docs.claude.com/en/docs/agents-and-tools/agent-skills
 */
export const claudeCompiler: Compiler = {
  target: "claude",
  defaultOutputPath: (name) => `.claude/skills/${name}/SKILL.md`,
  compile(skill: Skill, outputRoot: string): CompileResult {
    const { name, description, version, license, author } = skill.frontmatter;

    const frontmatter = [
      "---",
      `name: ${name}`,
      `description: ${JSON.stringify(description)}`,
      `version: ${version}`,
      license ? `license: ${license}` : null,
      author ? `author: ${author}` : null,
      "---",
      "",
    ]
      .filter((l) => l !== null)
      .join("\n");

    const content = `${frontmatter}${skill.body}\n`;
    const outputPath = join(outputRoot, `.claude/skills/${name}/SKILL.md`);

    return { target: "claude", outputPath, content };
  },
};
