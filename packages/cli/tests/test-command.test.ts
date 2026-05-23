import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  SNAPSHOTS_DIR,
  checkSnapshot,
  compactLineDiff,
  listExistingSnapshots,
  readSnapshot,
  writeSnapshot,
  type EvalRunner,
} from "@crosskill/core/node";
import { testCommand } from "../src/commands/test.js";

const SKILL_A = `---
name: skill-a
version: 0.1.0
description: First test skill for the test-command tests, with one example
targets:
  claude: true
  cursor: true
examples:
  - input: "say hello"
    contains: ["hello"]
  - input: "say goodbye"
    matches: "bye"
---
You are a friendly bot.

When given any input:

1. Respond with the matching greeting.
2. Be brief.

## Examples
**In:** say hello. **Out:** hello there.
`;

const SKILL_B = `---
name: skill-b
version: 0.1.0
description: Second test skill, no examples block
targets:
  claude: true
---
Summarise the input.

## Examples
**In:** foo. **Out:** foo summary.
`;

let cwd: string;

function writeSkill(name: string, src: string): void {
  const dir = join(cwd, "crosskill");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${name}.skill.md`), src, "utf8");
}

function snapDir(): string {
  return join(cwd, "crosskill", SNAPSHOTS_DIR);
}

beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), "crosskill-test-"));
});

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

describe("checkSnapshot", () => {
  test("missing snapshot returns 'missing' when not updating", () => {
    const r = checkSnapshot(join(cwd, "crosskill"), { skill: "x", target: "claude" }, "hi", false);
    expect(r.status).toBe("missing");
  });

  test("update writes the snapshot to disk", () => {
    const r = checkSnapshot(join(cwd, "crosskill"), { skill: "x", target: "claude" }, "hi", true);
    expect(r.status).toBe("written");
    expect(readSnapshot(join(cwd, "crosskill"), { skill: "x", target: "claude" })).toBe("hi");
  });

  test("identical content returns 'match'", () => {
    writeSnapshot(join(cwd, "crosskill"), { skill: "x", target: "claude" }, "hi");
    const r = checkSnapshot(join(cwd, "crosskill"), { skill: "x", target: "claude" }, "hi", false);
    expect(r.status).toBe("match");
  });

  test("differing content returns 'drift' with both sides", () => {
    writeSnapshot(join(cwd, "crosskill"), { skill: "x", target: "claude" }, "old");
    const r = checkSnapshot(join(cwd, "crosskill"), { skill: "x", target: "claude" }, "new", false);
    expect(r.status).toBe("drift");
    expect(r.expected).toBe("old");
    expect(r.actual).toBe("new");
  });
});

describe("compactLineDiff", () => {
  test("shows - and + lines for differing lines only", () => {
    const d = compactLineDiff("a\nb\nc", "a\nB\nc");
    expect(d).toContain("- b");
    expect(d).toContain("+ B");
    expect(d).not.toContain("a\n");
  });

  test("caps at maxLines and adds truncated marker", () => {
    const e = Array.from({ length: 20 }, (_, i) => `e${i}`).join("\n");
    const a = Array.from({ length: 20 }, (_, i) => `a${i}`).join("\n");
    const d = compactLineDiff(e, a, 4);
    expect(d).toContain("(truncated)");
  });
});

describe("listExistingSnapshots", () => {
  test("returns nothing when snapshots dir is absent", () => {
    expect(listExistingSnapshots(join(cwd, "crosskill"))).toEqual([]);
  });

  test("lists {skill, target} pairs from disk", () => {
    writeSnapshot(join(cwd, "crosskill"), { skill: "a", target: "claude" }, "x");
    writeSnapshot(join(cwd, "crosskill"), { skill: "a", target: "cursor" }, "y");
    writeSnapshot(join(cwd, "crosskill"), { skill: "b", target: "claude" }, "z");
    const found = listExistingSnapshots(join(cwd, "crosskill")).sort((a, b) =>
      `${a.skill}::${a.target}`.localeCompare(`${b.skill}::${b.target}`)
    );
    expect(found).toEqual([
      { skill: "a", target: "claude" },
      { skill: "a", target: "cursor" },
      { skill: "b", target: "claude" },
    ]);
  });
});

describe("testCommand — snapshot mode", () => {
  test("first run with --update-snapshots writes files and exits 0", async () => {
    writeSkill("skill-a", SKILL_A);
    writeSkill("skill-b", SKILL_B);

    const prev = process.exitCode;
    process.exitCode = 0;
    await testCommand({ cwd, updateSnapshots: true });
    expect(process.exitCode).toBe(0);

    expect(existsSync(join(snapDir(), "skill-a", "claude.txt"))).toBe(true);
    expect(existsSync(join(snapDir(), "skill-a", "cursor.txt"))).toBe(true);
    expect(existsSync(join(snapDir(), "skill-b", "claude.txt"))).toBe(true);
    process.exitCode = prev;
  });

  test("second run without --update-snapshots passes when nothing changed", async () => {
    writeSkill("skill-a", SKILL_A);
    await testCommand({ cwd, updateSnapshots: true });

    const prev = process.exitCode;
    process.exitCode = 0;
    await testCommand({ cwd });
    expect(process.exitCode).toBe(0);
    process.exitCode = prev;
  });

  test("run fails with exit 1 when a skill body changes without updating snapshots", async () => {
    writeSkill("skill-a", SKILL_A);
    await testCommand({ cwd, updateSnapshots: true });

    writeSkill("skill-a", SKILL_A.replace("Be brief.", "Be VERY brief."));

    const prev = process.exitCode;
    process.exitCode = 0;
    await testCommand({ cwd });
    expect(process.exitCode).toBe(1);
    process.exitCode = prev;
  });

  test("missing snapshot for a new skill fails until --update-snapshots is run", async () => {
    writeSkill("skill-a", SKILL_A);
    await testCommand({ cwd, updateSnapshots: true });
    writeSkill("skill-b", SKILL_B);

    const prev = process.exitCode;
    process.exitCode = 0;
    await testCommand({ cwd });
    expect(process.exitCode).toBe(1);

    process.exitCode = 0;
    await testCommand({ cwd, updateSnapshots: true });
    expect(process.exitCode).toBe(0);
    process.exitCode = prev;
  });

  test("orphan snapshots fail without --update-snapshots, get cleaned with it", async () => {
    writeSkill("skill-a", SKILL_A);
    writeSkill("skill-b", SKILL_B);
    await testCommand({ cwd, updateSnapshots: true });

    // Delete skill-b but leave its snapshot behind
    rmSync(join(cwd, "crosskill", "skill-b.skill.md"));

    const prev = process.exitCode;
    process.exitCode = 0;
    await testCommand({ cwd });
    expect(process.exitCode).toBe(1);

    process.exitCode = 0;
    await testCommand({ cwd, updateSnapshots: true });
    expect(process.exitCode).toBe(0);
    expect(existsSync(join(snapDir(), "skill-b"))).toBe(false);
    process.exitCode = prev;
  });
});

describe("testCommand — --eval mode", () => {
  function makeRunner(reply: string, options: { reachable?: boolean } = {}): EvalRunner {
    return {
      name: "fake-runner",
      async ping() {
        return options.reachable === false ? { ok: false, reason: "test stub unreachable" } : { ok: true };
      },
      async complete() {
        return reply;
      },
    };
  }

  test("passes when reply contains every expected substring", async () => {
    writeSkill("skill-a", SKILL_A);
    await testCommand({ cwd, updateSnapshots: true });

    const prev = process.exitCode;
    process.exitCode = 0;
    await testCommand({
      cwd,
      eval: true,
      // Reply matches both `contains: ["hello"]` and `matches: "bye"`
      runner: makeRunner("hello and goodbye"),
    });
    expect(process.exitCode).toBe(0);
    process.exitCode = prev;
  });

  test("fails when reply is missing a required substring", async () => {
    writeSkill("skill-a", SKILL_A);
    await testCommand({ cwd, updateSnapshots: true });

    const prev = process.exitCode;
    process.exitCode = 0;
    await testCommand({
      cwd,
      eval: true,
      // Has "bye" so example #1 passes, but missing "hello" so example #0 fails
      runner: makeRunner("only goodbye"),
    });
    expect(process.exitCode).toBe(1);
    process.exitCode = prev;
  });

  test("eval is skipped (exit 0) when runner is unreachable", async () => {
    writeSkill("skill-a", SKILL_A);
    await testCommand({ cwd, updateSnapshots: true });

    const prev = process.exitCode;
    process.exitCode = 0;
    await testCommand({
      cwd,
      eval: true,
      runner: makeRunner("ignored", { reachable: false }),
    });
    expect(process.exitCode).toBe(0);
    process.exitCode = prev;
  });
});
