import { describe, expect, test } from "bun:test";
import { parseSkillString } from "../src/parser.js";
import { COMPILERS } from "../src/compilers/index.js";

const SKILL_TEXT = `---
name: code-reviewer
version: 0.1.0
description: Structured code review with bugs and style sections
tags: [code-review]
targets:
  claude: true
  cursor: true
  codex: true
  windsurf: true
  aider: true
  opencode: true
  gemini: true
  copilot: true
  continue: true
---

You are a code reviewer.

## Examples
- example output
`;

const skill = parseSkillString(SKILL_TEXT);

describe("compilers", () => {
  test("claude compiler emits expected path and frontmatter", () => {
    const r = COMPILERS.claude!.compile(skill, "/repo");
    expect(r.outputPath.replace(/\\/g, "/")).toBe("/repo/.claude/skills/code-reviewer/SKILL.md");
    expect(r.content).toContain("name: code-reviewer");
    expect(r.content).toContain("You are a code reviewer.");
  });

  test("cursor compiler emits .mdc with description", () => {
    const r = COMPILERS.cursor!.compile(skill, "/repo");
    expect(r.outputPath.replace(/\\/g, "/")).toBe("/repo/.cursor/rules/code-reviewer.mdc");
    expect(r.content).toContain("description:");
    expect(r.content).toContain("# code-reviewer");
  });

  test("codex compiler emits an AGENTS.md section", () => {
    const r = COMPILERS.codex!.compile(skill, "/repo");
    expect(r.outputPath.replace(/\\/g, "/")).toBe("/repo/AGENTS.md");
    expect(r.content.startsWith("## code-reviewer")).toBe(true);
  });

  test("windsurf compiler emits a per-skill .md", () => {
    const r = COMPILERS.windsurf!.compile(skill, "/repo");
    expect(r.outputPath.replace(/\\/g, "/")).toBe("/repo/.windsurf/rules/code-reviewer.md");
    expect(r.content).toContain("# code-reviewer");
  });

  test("aider compiler emits skill file under .aider/skills/", () => {
    const r = COMPILERS.aider!.compile(skill, "/repo");
    expect(r.outputPath.replace(/\\/g, "/")).toBe("/repo/.aider/skills/code-reviewer.md");
  });

  test("opencode compiler emits front-matter md", () => {
    const r = COMPILERS.opencode!.compile(skill, "/repo");
    expect(r.outputPath.replace(/\\/g, "/")).toBe("/repo/.opencode/skills/code-reviewer.md");
    expect(r.content).toContain("name: code-reviewer");
  });

  test("gemini compiler emits a per-skill .md", () => {
    const r = COMPILERS.gemini!.compile(skill, "/repo");
    expect(r.outputPath.replace(/\\/g, "/")).toBe("/repo/.gemini/skills/code-reviewer.md");
  });

  test("copilot compiler emits a .github/copilot-instructions.md section", () => {
    const r = COMPILERS.copilot!.compile(skill, "/repo");
    expect(r.outputPath.replace(/\\/g, "/")).toBe("/repo/.github/copilot-instructions.md");
    expect(r.content.startsWith("## code-reviewer")).toBe(true);
  });

  test("continue compiler emits a per-skill .md under .continue/", () => {
    const r = COMPILERS.continue!.compile(skill, "/repo");
    expect(r.outputPath.replace(/\\/g, "/")).toBe("/repo/.continue/code-reviewer.md");
    expect(r.content).toContain("# code-reviewer");
  });
});
