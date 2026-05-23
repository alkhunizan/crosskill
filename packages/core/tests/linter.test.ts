import { describe, expect, test } from "bun:test";
import { parseSkillString } from "../src/parser.js";
import { lintSkill } from "../src/linter.js";

describe("linter", () => {
  test("clean skill produces no issues", () => {
    const s = parseSkillString(`---
name: clean
version: 0.1.0
description: A skill with examples and concrete language for testing the linter happy path
targets:
  claude: true
---

You output a structured review. Return the result as a JSON object with keys: bugs, perf, style.
Quote line numbers.

## Examples

Input: a function with a bug.
Output: a structured JSON list of the bugs.
`);
    const issues = lintSkill(s);
    expect(issues.filter((i) => i.level === "error")).toEqual([]);
  });

  test("missing examples produces warning", () => {
    const s = parseSkillString(`---
name: no-examples
version: 0.1.0
description: A skill that has no examples section to trigger the linter warning
targets:
  claude: true
---

Return a JSON structured response with line numbers.
`);
    const issues = lintSkill(s);
    expect(issues.some((i) => i.rule === "require-examples")).toBe(true);
  });

  test("no targets produces error", () => {
    const s = parseSkillString(`---
name: no-targets
version: 0.1.0
description: A skill with no targets enabled at all to trigger the error
targets: {}
---

Quote line numbers. Return JSON.

## Examples
foo
`);
    const issues = lintSkill(s);
    expect(issues.some((i) => i.rule === "no-targets" && i.level === "error")).toBe(true);
  });
});
