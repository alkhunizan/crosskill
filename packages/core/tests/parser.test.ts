import { describe, expect, test } from "bun:test";
import { parseSkillString, SkillParseError } from "../src/parser.js";

const VALID = `---
name: code-reviewer
version: 0.1.0
description: Structured code review with bugs and style sections
tags: [code-review]
targets:
  claude: true
  cursor: true
---

You are a code reviewer.

## Examples
- foo
`;

describe("parser", () => {
  test("parses valid skill", () => {
    const s = parseSkillString(VALID);
    expect(s.frontmatter.name).toBe("code-reviewer");
    expect(s.frontmatter.version).toBe("0.1.0");
    expect(s.frontmatter.targets.claude).toBe(true);
    expect(s.frontmatter.targets.cursor).toBe(true);
    expect(s.body).toContain("You are a code reviewer.");
    expect(s.body).toContain("## Examples");
  });

  test("rejects invalid kebab-case name", () => {
    const bad = VALID.replace("code-reviewer", "Code_Reviewer");
    expect(() => parseSkillString(bad)).toThrow(SkillParseError);
  });

  test("rejects empty body", () => {
    const bad = `---\nname: x\nversion: 0.1.0\ndescription: minimal description here\ntargets:\n  claude: true\n---\n\n   \n`;
    expect(() => parseSkillString(bad)).toThrow(SkillParseError);
  });

  test("defaults version to 0.1.0 when omitted", () => {
    const noVersion = `---\nname: foo\ndescription: a perfectly fine description\ntargets:\n  claude: true\n---\n\nbody here.\n`;
    const s = parseSkillString(noVersion);
    expect(s.frontmatter.version).toBe("0.1.0");
  });

  test("rejects invalid semver", () => {
    const bad = VALID.replace("0.1.0", "v1");
    expect(() => parseSkillString(bad)).toThrow(SkillParseError);
  });
});
