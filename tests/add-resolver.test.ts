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
import { parseRef } from "../src/resolvers/resolver.js";
import { buildCandidateUrls, createGithubResolver } from "../src/resolvers/github.js";
import { localResolver } from "../src/resolvers/local.js";
import { addCommand } from "../src/commands/add.js";
import { sha256 } from "../src/lockfile.js";

const VALID_SKILL = `---
name: hello-world
version: 0.1.0
description: A tiny hello-world skill, used by tests to assert resolve + write
targets:
  claude: true
---
Say hello, then stop talking.

## Examples
**In:** hi. **Out:** hello.
`;

let cwd: string;

function writeConfig(): void {
  writeFileSync(join(cwd, "crosskill.config.json"), '{"skillsDir":"./crosskill"}\n', "utf8");
}

beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), "crosskill-add-"));
});

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

describe("parseRef", () => {
  test("bare kebab name → local", () => {
    expect(parseRef("code-reviewer")).toEqual({ kind: "local", name: "code-reviewer" });
  });

  test("@crosskill/<name> → local", () => {
    expect(parseRef("@crosskill/code-reviewer")).toEqual({
      kind: "local",
      name: "code-reviewer",
    });
  });

  test("user/repo → github (no ref, no path)", () => {
    expect(parseRef("aziz/najdi-writer")).toEqual({
      kind: "github",
      user: "aziz",
      repo: "najdi-writer",
      path: undefined,
      ref: undefined,
    });
  });

  test("user/repo@ref → github with ref", () => {
    expect(parseRef("aziz/najdi-writer@v0.1.0")).toEqual({
      kind: "github",
      user: "aziz",
      repo: "najdi-writer",
      path: undefined,
      ref: "v0.1.0",
    });
  });

  test("user/repo/path → github with path", () => {
    expect(parseRef("aziz/my-skills/skills/code-reviewer.skill.md")).toEqual({
      kind: "github",
      user: "aziz",
      repo: "my-skills",
      path: "skills/code-reviewer.skill.md",
      ref: undefined,
    });
  });

  test("@scope/name (non-crosskill) → registry (reserved)", () => {
    expect(parseRef("@team/secret-skill")).toEqual({
      kind: "registry",
      scope: "team",
      name: "secret-skill",
    });
  });

  test("garbage returns null", () => {
    expect(parseRef("not a ref")).toBeNull();
    expect(parseRef("UPPERCASE")).toBeNull();
    expect(parseRef("")).toBeNull();
  });
});

describe("buildCandidateUrls", () => {
  test("defaults to HEAD and tries skill.md then <repo>.skill.md", () => {
    expect(buildCandidateUrls("u", "r", undefined, undefined)).toEqual([
      "https://raw.githubusercontent.com/u/r/HEAD/skill.md",
      "https://raw.githubusercontent.com/u/r/HEAD/r.skill.md",
    ]);
  });

  test("honours an explicit ref", () => {
    expect(buildCandidateUrls("u", "r", "v1.2.3", undefined)).toEqual([
      "https://raw.githubusercontent.com/u/r/v1.2.3/skill.md",
      "https://raw.githubusercontent.com/u/r/v1.2.3/r.skill.md",
    ]);
  });

  test("an explicit path skips the convention candidates", () => {
    expect(buildCandidateUrls("u", "r", "main", "skills/a/skill.md")).toEqual([
      "https://raw.githubusercontent.com/u/r/main/skills/a/skill.md",
    ]);
  });
});

describe("githubResolver (mocked fetch)", () => {
  function mockFetch(map: Record<string, { ok: boolean; status?: number; body?: string }>) {
    return (async (url: string) => {
      const m = map[url];
      if (!m) return { ok: false, status: 404, text: async () => "" } as unknown as Response;
      return {
        ok: m.ok,
        status: m.status ?? (m.ok ? 200 : 404),
        text: async () => m.body ?? "",
      } as unknown as Response;
    }) as unknown as typeof fetch;
  }

  test("fetches the first candidate that 200s", async () => {
    const resolver = createGithubResolver(
      mockFetch({
        "https://raw.githubusercontent.com/u/r/HEAD/skill.md": { ok: true, body: VALID_SKILL },
      })
    );
    const result = await resolver.resolve("u/r");
    expect(result.content).toBe(VALID_SKILL);
    expect(result.source).toBe("github: u/r");
  });

  test("falls through to <repo>.skill.md when skill.md 404s", async () => {
    const resolver = createGithubResolver(
      mockFetch({
        "https://raw.githubusercontent.com/u/r/HEAD/r.skill.md": { ok: true, body: VALID_SKILL },
      })
    );
    const result = await resolver.resolve("u/r");
    expect(result.content).toBe(VALID_SKILL);
  });

  test("includes the ref in the provenance label", async () => {
    const resolver = createGithubResolver(
      mockFetch({
        "https://raw.githubusercontent.com/u/r/abc1234/skill.md": { ok: true, body: VALID_SKILL },
      })
    );
    const result = await resolver.resolve("u/r@abc1234");
    expect(result.source).toBe("github: u/r@abc1234");
  });

  test("throws with all tried URLs when nothing resolves", async () => {
    const resolver = createGithubResolver(mockFetch({}));
    await expect(resolver.resolve("u/r")).rejects.toThrow(/raw.githubusercontent.com\/u\/r/);
  });
});

describe("localResolver", () => {
  test("resolves a known bundled starter", async () => {
    const { content, source } = await localResolver.resolve("code-reviewer");
    expect(content).toContain("name: code-reviewer");
    expect(source).toBe("local: code-reviewer");
  });

  test("resolves @crosskill/<name> the same as bare name", async () => {
    const a = await localResolver.resolve("code-reviewer");
    const b = await localResolver.resolve("@crosskill/code-reviewer");
    expect(a.content).toBe(b.content);
  });

  test("throws helpfully when the starter doesn't exist", async () => {
    await expect(localResolver.resolve("not-a-real-skill")).rejects.toThrow(/not found/);
  });
});

describe("addCommand", () => {
  function fakeResolver(content: string, name = "fake") {
    return {
      name,
      canResolve: (ref: string) => ref === "fake",
      resolve: async () => ({ content, source: `fake: ${name}` }),
    };
  }

  test("errors without crosskill.config.json", async () => {
    const prev = process.exitCode;
    process.exitCode = 0;
    await addCommand("code-reviewer", { cwd });
    expect(process.exitCode).toBe(1);
    process.exitCode = prev;
  });

  test("writes a resolved skill to ./crosskill/<name>.skill.md", async () => {
    writeConfig();
    await addCommand("fake", { cwd, resolvers: [fakeResolver(VALID_SKILL)] });
    const dest = join(cwd, "crosskill", "hello-world.skill.md");
    expect(existsSync(dest)).toBe(true);
    expect(readFileSync(dest, "utf8")).toBe(VALID_SKILL);
  });

  test("--dry-run does not write", async () => {
    writeConfig();
    await addCommand("fake", {
      cwd,
      dryRun: true,
      resolvers: [fakeResolver(VALID_SKILL)],
    });
    const dest = join(cwd, "crosskill", "hello-world.skill.md");
    expect(existsSync(dest)).toBe(false);
  });

  test("--sha matching the content succeeds", async () => {
    writeConfig();
    const prev = process.exitCode;
    process.exitCode = 0;
    await addCommand("fake", {
      cwd,
      sha: sha256(VALID_SKILL),
      resolvers: [fakeResolver(VALID_SKILL)],
    });
    expect(process.exitCode).toBe(0);
    process.exitCode = prev;
  });

  test("--sha mismatch fails fast and does not write", async () => {
    writeConfig();
    const prev = process.exitCode;
    process.exitCode = 0;
    await addCommand("fake", {
      cwd,
      sha: "0".repeat(64),
      resolvers: [fakeResolver(VALID_SKILL)],
    });
    expect(process.exitCode).toBe(1);
    expect(existsSync(join(cwd, "crosskill", "hello-world.skill.md"))).toBe(false);
    process.exitCode = prev;
  });

  test("validates front-matter; rejects garbage content", async () => {
    writeConfig();
    const prev = process.exitCode;
    process.exitCode = 0;
    await addCommand("fake", {
      cwd,
      resolvers: [fakeResolver("not a skill, just markdown")],
    });
    expect(process.exitCode).toBe(1);
    process.exitCode = prev;
  });

  test("registry refs (non-crosskill scope) print a clear not-implemented message", async () => {
    writeConfig();
    const prev = process.exitCode;
    process.exitCode = 0;
    await addCommand("@team/secret", { cwd });
    expect(process.exitCode).toBe(1);
    process.exitCode = prev;
  });

  test("garbage refs are rejected up-front", async () => {
    writeConfig();
    const prev = process.exitCode;
    process.exitCode = 0;
    await addCommand("nope nope", { cwd });
    expect(process.exitCode).toBe(1);
    process.exitCode = prev;
  });

  test("does not overwrite an existing skill", async () => {
    writeConfig();
    mkdirSync(join(cwd, "crosskill"), { recursive: true });
    const dest = join(cwd, "crosskill", "hello-world.skill.md");
    writeFileSync(dest, "OLD CONTENT\n", "utf8");

    await addCommand("fake", { cwd, resolvers: [fakeResolver(VALID_SKILL)] });
    expect(readFileSync(dest, "utf8")).toBe("OLD CONTENT\n");
  });
});
