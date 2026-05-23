import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import kleur from "kleur";

const DEFAULT_CONFIG = {
  skillsDir: "./crosskill",
  outputs: {
    claude: ".claude/skills",
    cursor: ".cursor/rules",
    codex: "AGENTS.md",
    windsurf: ".windsurf/rules",
    aider: ".aider/skills",
    opencode: ".opencode/skills",
    gemini: ".gemini/skills",
  },
  lint: {
    minBodyLength: 80,
    maxBodyLength: 8000,
    requireExamples: true,
  },
};

const SAMPLE_SKILL = `---
name: code-reviewer
version: 0.1.0
description: Structured code review with bugs / performance / style sections
tags: [code-review, quality]
targets:
  claude: true
  cursor: true
  codex: true
  windsurf: true
  aider: true
  opencode: true
  gemini: true
---

You are an expert code reviewer.

When given code:

1. Identify bugs, edge cases, and security issues — quote the exact line.
2. Suggest performance improvements with estimated impact.
3. Flag style and consistency issues; link to the project style guide if present.
4. Output a structured review with these sections in order:
   - \`## Bugs\` — must-fix correctness issues
   - \`## Performance\` — measurable wins
   - \`## Style\` — readability / conventions
   - \`## Nits\` — trivial polish

Be specific. Quote line numbers. Propose patches as fenced diff blocks.

## Examples

**Input:** a Python function with a race condition on a shared dict.

**Output:**
\`\`\`
## Bugs
- Line 14: \`self.cache[key] = value\` is not thread-safe. Wrap in a \`threading.Lock()\`.

## Performance
- Line 22: O(n) list lookup; switch to a set.
\`\`\`
`;

export async function initCommand(): Promise<void> {
  const cwd = process.cwd();
  const configPath = join(cwd, "crosskill.config.json");
  const skillsDir = join(cwd, "crosskill");
  const samplePath = join(skillsDir, "code-reviewer.skill.md");

  if (existsSync(configPath)) {
    console.log(kleur.yellow("crosskill is already initialized in this directory."));
    console.log(kleur.dim(`Config: ${configPath}`));
    return;
  }

  mkdirSync(skillsDir, { recursive: true });
  writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2) + "\n", "utf8");
  writeFileSync(samplePath, SAMPLE_SKILL, "utf8");

  console.log(kleur.green().bold("\n✓ crosskill initialized."));
  console.log(`  ${kleur.dim("config:")} crosskill.config.json`);
  console.log(`  ${kleur.dim("sample:")} crosskill/code-reviewer.skill.md`);
  console.log();
  console.log(kleur.bold("Next:"));
  console.log("  1. Edit the sample skill (or add new ones)");
  console.log(`  2. Run ${kleur.cyan("npx crosskill build")} to compile to every tool`);
  console.log(`  3. Run ${kleur.cyan("npx crosskill lint")} before shipping`);
  console.log();
}
