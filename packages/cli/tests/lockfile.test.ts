import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  CROSSKILL_VERSION,
  LOCKFILE_NAME,
  LOCKFILE_VERSION,
  diffLockfiles,
  readLockfile,
  sha256,
  stringifyLockfile,
  toPosixPath,
  writeLockfile,
  parseSkillString,
  type Lockfile,
} from "@crosskill/core/node";
import { buildCommand, planBuild } from "../src/commands/build.js";

const SKILL_A = `---
name: skill-a
version: 0.1.0
description: First test skill — short and sweet for the lockfile tests
targets:
  claude: true
  cursor: true
  codex: true
---
Be a helpful agent. Output the answer in one paragraph.

## Examples
**In:** hi. **Out:** hello.
`;

const SKILL_B = `---
name: skill-b
version: 0.2.0
description: Second test skill, also targets the aggregated copilot file
targets:
  claude: true
  codex: true
  copilot: true
---
Summarise the input in 30 words or fewer.

## Examples
**In:** a long paragraph. **Out:** the summary.
`;

let cwd: string;

function writeSkill(name: string, src: string): void {
  const dir = join(cwd, "crosskill");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${name}.skill.md`), src, "utf8");
}

beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), "crosskill-lock-"));
});

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

describe("sha256 + toPosixPath", () => {
  test("sha256 is stable for the same input", () => {
    expect(sha256("hello")).toBe(sha256("hello"));
    expect(sha256("hello")).not.toBe(sha256("hellp"));
  });

  test("toPosixPath flips backslashes", () => {
    expect(toPosixPath(".github\\foo\\bar.md")).toBe(".github/foo/bar.md");
    expect(toPosixPath("./already/posix.md")).toBe("./already/posix.md");
  });
});

describe("stringifyLockfile", () => {
  test("emits sorted, deterministic JSON with trailing newline", () => {
    const lock: Lockfile = {
      lockfileVersion: LOCKFILE_VERSION,
      crosskillVersion: CROSSKILL_VERSION,
      skills: {
        zebra: { version: "1.0.0", sourceHash: "h2", outputs: { cursor: { path: "z.mdc", contentHash: "c2" } } },
        alpha: { version: "1.0.0", sourceHash: "h1", outputs: { claude: { path: "a.md", contentHash: "c1" } } },
      },
      aggregated: {
        copilot: { path: ".github/copilot-instructions.md", contentHash: "agg2", sections: 1 },
        codex: { path: "AGENTS.md", contentHash: "agg1", sections: 2 },
      },
    };
    const out = stringifyLockfile(lock);
    expect(out.endsWith("\n")).toBe(true);
    // Skill keys sorted alphabetically: alpha before zebra
    expect(out.indexOf('"alpha"')).toBeLessThan(out.indexOf('"zebra"'));
    // Aggregated keys sorted alphabetically: codex before copilot
    expect(out.indexOf('"codex"')).toBeLessThan(out.indexOf('"copilot"'));
  });
});

describe("planBuild lockfile output", () => {
  test("produces the same lockfile on identical inputs", () => {
    const sources = [
      { skill: parseSkillString(SKILL_A), sourceBytes: Buffer.from(SKILL_A) },
      { skill: parseSkillString(SKILL_B), sourceBytes: Buffer.from(SKILL_B) },
    ];
    const plan1 = planBuild(sources, "/repo");
    const plan2 = planBuild(sources, "/repo");
    expect(stringifyLockfile(plan1.lockfile)).toBe(stringifyLockfile(plan2.lockfile));
  });

  test("flips source hash when one byte of one skill changes", () => {
    const original = [
      { skill: parseSkillString(SKILL_A), sourceBytes: Buffer.from(SKILL_A) },
      { skill: parseSkillString(SKILL_B), sourceBytes: Buffer.from(SKILL_B) },
    ];
    const mutated = SKILL_A.replace("Be a helpful agent.", "Be a helpful agent!");
    const after = [
      { skill: parseSkillString(mutated), sourceBytes: Buffer.from(mutated) },
      { skill: parseSkillString(SKILL_B), sourceBytes: Buffer.from(SKILL_B) },
    ];
    const before = planBuild(original, "/repo").lockfile;
    const afterPlan = planBuild(after, "/repo").lockfile;

    expect(before.skills["skill-a"]!.sourceHash).not.toBe(afterPlan.skills["skill-a"]!.sourceHash);
    expect(before.skills["skill-b"]!.sourceHash).toBe(afterPlan.skills["skill-b"]!.sourceHash);
    // All outputs of skill-a should also flip because the body is in every emitted file
    for (const target of Object.keys(before.skills["skill-a"]!.outputs)) {
      expect(before.skills["skill-a"]!.outputs[target]!.contentHash).not.toBe(
        afterPlan.skills["skill-a"]!.outputs[target]!.contentHash
      );
    }
  });

  test("records aggregated outputs (AGENTS.md, copilot-instructions.md)", () => {
    const sources = [
      { skill: parseSkillString(SKILL_A), sourceBytes: Buffer.from(SKILL_A) },
      { skill: parseSkillString(SKILL_B), sourceBytes: Buffer.from(SKILL_B) },
    ];
    const plan = planBuild(sources, "/repo");
    expect(plan.lockfile.aggregated.codex?.path).toBe("AGENTS.md");
    expect(plan.lockfile.aggregated.codex?.sections).toBe(2);
    expect(plan.lockfile.aggregated.copilot?.path).toBe(".github/copilot-instructions.md");
    expect(plan.lockfile.aggregated.copilot?.sections).toBe(1);
  });
});

describe("diffLockfiles", () => {
  function mkLock(skillName: string, sourceHash: string, outputHash: string): Lockfile {
    return {
      lockfileVersion: LOCKFILE_VERSION,
      crosskillVersion: CROSSKILL_VERSION,
      skills: {
        [skillName]: {
          version: "0.1.0",
          sourceHash,
          outputs: { claude: { path: "a.md", contentHash: outputHash } },
        },
      },
      aggregated: {},
    };
  }

  test("returns empty array for identical lockfiles", () => {
    const a = mkLock("foo", "h1", "h2");
    const b = mkLock("foo", "h1", "h2");
    expect(diffLockfiles(a, b)).toEqual([]);
  });

  test("flags source-hash drift", () => {
    const drift = diffLockfiles(mkLock("foo", "NEW", "h2"), mkLock("foo", "h1", "h2"));
    expect(drift).toHaveLength(1);
    expect(drift[0]!.kind).toBe("source-hash");
    expect(drift[0]!.skill).toBe("foo");
  });

  test("flags output-hash drift", () => {
    const drift = diffLockfiles(mkLock("foo", "h1", "NEW"), mkLock("foo", "h1", "h2"));
    expect(drift).toHaveLength(1);
    expect(drift[0]!.kind).toBe("output-hash");
    expect(drift[0]!.target).toBe("claude");
  });

  test("flags missing and extra skills", () => {
    const current = mkLock("new-skill", "h", "h");
    const locked = mkLock("old-skill", "h", "h");
    const drift = diffLockfiles(current, locked);
    const kinds = drift.map((d) => d.kind).sort();
    expect(kinds).toEqual(["extra-skill", "missing-skill"]);
  });
});

describe("readLockfile / writeLockfile", () => {
  test("round-trips through disk", () => {
    const lock: Lockfile = {
      lockfileVersion: LOCKFILE_VERSION,
      crosskillVersion: CROSSKILL_VERSION,
      skills: { foo: { version: "1.0.0", sourceHash: "h", outputs: {} } },
      aggregated: {},
    };
    writeLockfile(cwd, lock);
    const read = readLockfile(cwd);
    expect(read).toEqual(lock);
  });

  test("returns null when no lockfile exists", () => {
    expect(readLockfile(cwd)).toBeNull();
  });

  test("throws on incompatible lockfileVersion", () => {
    writeFileSync(
      join(cwd, LOCKFILE_NAME),
      JSON.stringify({ lockfileVersion: 99, crosskillVersion: "x", skills: {}, aggregated: {} }),
      "utf8"
    );
    expect(() => readLockfile(cwd)).toThrow(/lockfileVersion/);
  });

  test("throws on malformed JSON", () => {
    writeFileSync(join(cwd, LOCKFILE_NAME), "{not json", "utf8");
    expect(() => readLockfile(cwd)).toThrow(/not valid JSON/);
  });
});

describe("build + --frozen end-to-end", () => {
  test("build writes a lockfile; second build is byte-identical", async () => {
    writeSkill("skill-a", SKILL_A);
    writeSkill("skill-b", SKILL_B);

    await buildCommand({ cwd });
    expect(existsSync(join(cwd, LOCKFILE_NAME))).toBe(true);
    const lock1 = readFileSync(join(cwd, LOCKFILE_NAME), "utf8");

    await buildCommand({ cwd });
    const lock2 = readFileSync(join(cwd, LOCKFILE_NAME), "utf8");

    expect(lock1).toBe(lock2);
  });

  test("--frozen passes on clean tree", async () => {
    writeSkill("skill-a", SKILL_A);
    await buildCommand({ cwd });

    const prevExitCode = process.exitCode;
    process.exitCode = 0;
    await buildCommand({ cwd, frozen: true });
    expect(process.exitCode).toBe(0);
    process.exitCode = prevExitCode;
  });

  test("--frozen fails when a skill source has drifted", async () => {
    writeSkill("skill-a", SKILL_A);
    await buildCommand({ cwd });

    // Edit a skill but do not rebuild
    writeSkill("skill-a", SKILL_A.replace("Be a helpful agent.", "Be a different agent."));

    const prevExitCode = process.exitCode;
    process.exitCode = 0;
    await buildCommand({ cwd, frozen: true });
    expect(process.exitCode).toBe(1);
    process.exitCode = prevExitCode;
  });

  test("--frozen fails when no lockfile exists", async () => {
    writeSkill("skill-a", SKILL_A);

    const prevExitCode = process.exitCode;
    process.exitCode = 0;
    await buildCommand({ cwd, frozen: true });
    expect(process.exitCode).toBe(1);
    process.exitCode = prevExitCode;
  });
});
