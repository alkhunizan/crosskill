import { describe, expect, test } from "bun:test";
import { compileSkillForPreview } from "../src/compile.js";

const VALID = `---
name: hello
version: 0.1.0
description: A tiny skill used by the preview tests, with examples block
targets:
  claude: true
  cursor: true
  codex: true
---
Say hello. Be brief.

## Examples
**In:** hi. **Out:** hello.
`;

describe("compileSkillForPreview", () => {
  test("happy path: parses, lints, compiles every enabled target", () => {
    const r = compileSkillForPreview(VALID);
    expect(r.parseError).toBeUndefined();
    expect(r.skill?.frontmatter.name).toBe("hello");
    expect(r.lintIssues).toBeInstanceOf(Array);
    const targets = r.compiled.map((c) => c.target).sort();
    expect(targets).toEqual(["claude", "codex", "cursor"]);
  });

  test("onlyTargets restricts compilation", () => {
    const r = compileSkillForPreview(VALID, { onlyTargets: ["claude"] });
    expect(r.compiled).toHaveLength(1);
    expect(r.compiled[0]!.target).toBe("claude");
  });

  test("onlyTargets that isn't enabled in the skill yields no output for it", () => {
    const r = compileSkillForPreview(VALID, { onlyTargets: ["windsurf"] });
    expect(r.compiled).toHaveLength(0);
  });

  test("parse failure returns parseError and empty arrays", () => {
    const r = compileSkillForPreview("not even close to a skill");
    expect(r.parseError).toBeDefined();
    expect(r.skill).toBeUndefined();
    expect(r.lintIssues).toEqual([]);
    expect(r.compiled).toEqual([]);
  });

  test("invalid front-matter (e.g. uppercase name) returns parseError", () => {
    const bad = VALID.replace("name: hello", "name: Hello");
    const r = compileSkillForPreview(bad);
    expect(r.parseError).toBeDefined();
    expect(r.parseError!.message).toMatch(/kebab-case/);
  });

  test("custom lintConfig is honoured", () => {
    // Force the body to count as too short
    const r = compileSkillForPreview(VALID, {
      lintConfig: { minBodyLength: 100_000, maxBodyLength: 200_000, requireExamples: false },
    });
    const tooShort = r.lintIssues.find((i) => i.rule === "min-body-length");
    expect(tooShort).toBeDefined();
  });

  test("outputRoot is propagated to compiler outputs", () => {
    const r = compileSkillForPreview(VALID, { outputRoot: "/tmp/preview", onlyTargets: ["claude"] });
    expect(r.compiled[0]!.outputPath.replace(/\\/g, "/")).toBe(
      "/tmp/preview/.claude/skills/hello/SKILL.md"
    );
  });

  test("pure — calling twice with same input returns equal results", () => {
    const a = compileSkillForPreview(VALID);
    const b = compileSkillForPreview(VALID);
    expect(a.compiled.map((c) => c.content)).toEqual(b.compiled.map((c) => c.content));
    expect(a.lintIssues).toEqual(b.lintIssues);
  });
});
