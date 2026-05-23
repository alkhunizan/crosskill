# 02 — Phase 1: Monorepo Refactor

**Goal:** Move from single-package layout to monorepo. The CLI keeps working bit-for-bit identical. Library is now consumable by web + desktop.

**Time estimate:** ~2 hours
**Risk level:** Medium (touches every file). Tests are your safety net.
**Deliverable:** Tagged release `v0.2.0` with monorepo layout. CLI behavior unchanged.

---

## Step-by-step

### 1. Create branch

```bash
cd C:\Users\alkhu\Projects\crosskill
git checkout -b refactor/monorepo
```

### 2. Run baseline tests (must pass before you start)

```bash
bun install
bun test
# Expected: 15 pass, 0 fail
```

If anything fails before you start, fix that first. Do NOT start the refactor with red tests.

### 3. Create new layout

```bash
mkdir packages
mkdir packages\core
mkdir packages\core\src
mkdir packages\core\src\compilers
mkdir packages\core\tests
mkdir packages\cli
mkdir packages\cli\src
mkdir packages\cli\src\commands
mkdir packages\skills
```

### 4. Move source files

Move (don't copy) so git history follows:

```bash
git mv src\schema.ts packages\core\src\schema.ts
git mv src\parser.ts packages\core\src\parser.ts
git mv src\linter.ts packages\core\src\linter.ts
git mv src\compilers\* packages\core\src\compilers\
rmdir src\compilers
git mv src\index.ts packages\core\src\index.ts

git mv src\cli.ts packages\cli\src\cli.ts
git mv src\commands\* packages\cli\src\commands\
rmdir src\commands
rmdir src

git mv tests\parser.test.ts packages\core\tests\parser.test.ts
git mv tests\compilers.test.ts packages\core\tests\compilers.test.ts
git mv tests\linter.test.ts packages\core\tests\linter.test.ts
rmdir tests

git mv skills packages\skills
```

### 5. Update import paths

Inside `packages/cli/src/cli.ts` and `packages/cli/src/commands/*.ts`, change imports from local to the workspace package:

**Before:**
```ts
import { parseSkillFile } from "../parser.js";
import { COMPILERS } from "../compilers/index.js";
```

**After:**
```ts
import { parseSkillFile } from "@crosskill/core";
import { COMPILERS } from "@crosskill/core";
```

**Tip:** Run a project-wide find/replace:
- `from "../parser.js"` → `from "@crosskill/core"`
- `from "../linter.js"` → `from "@crosskill/core"`
- `from "../schema.js"` → `from "@crosskill/core"`
- `from "../compilers/index.js"` → `from "@crosskill/core"`

Inside `packages/core/src/index.ts`, keep all imports as relative (intra-package).

### 6. Write the new root `package.json`

Replace the existing root `package.json` with:

```json
{
  "name": "crosskill-monorepo",
  "version": "0.2.0",
  "private": true,
  "workspaces": ["packages/*", "apps/*"],
  "scripts": {
    "build": "bun run --filter '*' build",
    "test": "bun run --filter '*' test",
    "typecheck": "bun run --filter '*' typecheck",
    "lint": "prettier --check \"packages/*/src/**/*.ts\" \"apps/*/{src,app}/**/*.{ts,tsx}\"",
    "format": "prettier --write \"packages/*/src/**/*.ts\" \"apps/*/{src,app}/**/*.{ts,tsx}\""
  },
  "devDependencies": {
    "@types/bun": "latest",
    "prettier": "^3.3.3",
    "typescript": "^5.5.0"
  }
}
```

### 7. Write `packages/core/package.json`

```json
{
  "name": "@crosskill/core",
  "version": "0.2.0",
  "description": "Cross-platform compiler for AI coding-agent skills — core library",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./node": {
      "types": "./dist/node.d.ts",
      "import": "./dist/node.js"
    }
  },
  "files": ["dist", "README.md", "LICENSE"],
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "bun test",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "gray-matter": "^4.0.3",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5.5.0"
  },
  "keywords": ["ai", "agents", "skills", "compiler", "claude-code", "cursor"],
  "repository": {
    "type": "git",
    "url": "https://github.com/alkhunizan/crosskill.git",
    "directory": "packages/core"
  },
  "license": "MIT",
  "author": "Aziz Al-Khunizan <hello@azizme.com>"
}
```

### 8. Write `packages/core/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### 9. Split `parser.ts` into browser-safe + node-only

This is the key move. The current `parser.ts` imports `fs` and `path`, which break in the browser.

**Create `packages/core/src/parser.ts`** (browser-safe):

```ts
import matter from "gray-matter";
import { SkillFrontmatterSchema, type Skill } from "./schema.js";

export function parseSkillString(raw: string, sourcePath?: string): Skill {
  const parsed = matter(raw);
  const result = SkillFrontmatterSchema.safeParse(parsed.data);
  if (!result.success) {
    const where = sourcePath ?? "<inline>";
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new SkillParseError(`Invalid front-matter in ${where}\n${issues}`, where);
  }
  const body = parsed.content.trim();
  if (!body) {
    throw new SkillParseError(`Skill body is empty in ${sourcePath ?? "<inline>"}`, sourcePath ?? "<inline>");
  }
  return { frontmatter: result.data, body, sourcePath };
}

export class SkillParseError extends Error {
  constructor(message: string, public readonly source: string) {
    super(message);
    this.name = "SkillParseError";
  }
}
```

**Create `packages/core/src/node.ts`** (node-only — wraps the browser-safe parser):

```ts
import { readFileSync } from "node:fs";
import { parseSkillString, type Skill } from "./parser.js";
export * from "./index.js";

export function parseSkillFile(filePath: string): Skill {
  const raw = readFileSync(filePath, "utf8");
  return parseSkillString(raw, filePath);
}
```

**Update `packages/core/src/index.ts`** to NOT export `parseSkillFile` from the main entry. CLI imports from `@crosskill/core/node`, web imports from `@crosskill/core`.

### 10. Add a high-level `compileSkill` helper

Add to `packages/core/src/index.ts`:

```ts
import type { Skill, CompileResult, SupportedTarget } from "./schema.js";
import { COMPILERS } from "./compilers/index.js";

export function compileSkill(skill: Skill, outputRoot = ""): CompileResult[] {
  const results: CompileResult[] = [];
  const enabled = skill.frontmatter.targets ?? {};
  for (const target of Object.keys(enabled) as SupportedTarget[]) {
    if (!enabled[target]) continue;
    const compiler = COMPILERS[target];
    if (!compiler) continue;
    results.push(compiler.compile(skill, outputRoot));
  }
  return results;
}

export function compileSkills(skills: Skill[], outputRoot = ""): CompileResult[] {
  return skills.flatMap((s) => compileSkill(s, outputRoot));
}
```

This is what the web app will call. CLI keeps using the per-compiler loop because it needs the special AGENTS.md aggregation logic.

### 11. Write `packages/cli/package.json`

```json
{
  "name": "crosskill",
  "version": "0.2.0",
  "description": "CLI for crosskill — write AI coding-agent skills once, compile to every tool",
  "type": "module",
  "bin": { "crosskill": "./dist/cli.js" },
  "main": "./dist/cli.js",
  "files": ["dist", "README.md", "LICENSE"],
  "scripts": {
    "build": "bun build ./src/cli.ts --outdir ./dist --target node --external @crosskill/core",
    "test": "echo 'no cli tests yet'",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@crosskill/core": "workspace:*",
    "@crosskill/skills": "workspace:*",
    "commander": "^12.1.0",
    "kleur": "^4.1.5",
    "prompts": "^2.4.2"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "@types/prompts": "^2.4.9",
    "typescript": "^5.5.0"
  },
  "engines": { "node": ">=18" },
  "license": "MIT",
  "author": "Aziz Al-Khunizan <hello@azizme.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/alkhunizan/crosskill.git",
    "directory": "packages/cli"
  }
}
```

### 12. Write `packages/cli/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 13. Write `packages/skills/package.json`

```json
{
  "name": "@crosskill/skills",
  "version": "0.2.0",
  "description": "Starter skills for crosskill",
  "type": "module",
  "main": "./index.js",
  "files": ["**/*.md", "index.js", "index.d.ts"],
  "license": "MIT",
  "author": "Aziz Al-Khunizan <hello@azizme.com>"
}
```

Add `packages/skills/index.js` to enumerate available starter skills (for the web gallery + CLI `add` command):

```js
export const STARTER_SKILLS = [
  "code-reviewer",
  "commit-message",
  "pr-summarizer",
  "arabic-najdi-writer",
];
```

Update `packages/cli/src/commands/add.ts` to import this list and resolve skill paths relative to `@crosskill/skills`.

### 14. Write `tsconfig.base.json` at root

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "types": ["bun-types", "node"]
  }
}
```

### 15. Update existing CI workflow

`.github/workflows/ci.yml`:

```yaml
name: ci
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with: { bun-version: latest }
      - uses: actions/setup-node@v4
        with: { node-version: ${{ matrix.node-version }} }
      - run: bun install
      - run: bun run typecheck
      - run: bun test
      - run: bun run build
      - name: CLI smoke test
        run: |
          mkdir -p /tmp/smoke && cd /tmp/smoke
          node $GITHUB_WORKSPACE/packages/cli/dist/cli.js init
          node $GITHUB_WORKSPACE/packages/cli/dist/cli.js build
          node $GITHUB_WORKSPACE/packages/cli/dist/cli.js lint
          test -f .claude/skills/code-reviewer/SKILL.md
          test -f .cursor/rules/code-reviewer.mdc
          test -f AGENTS.md
```

### 16. Install + build + verify

```bash
cd C:\Users\alkhu\Projects\crosskill
bun install
bun run typecheck
bun test                            # MUST be 15/15 passing
bun run build
```

### 17. Behavioral verification — bit-for-bit identical CLI output

This is the **non-negotiable** check. The CLI output must be byte-identical to before the refactor.

```bash
# Make a temp folder and capture output BEFORE refactor (run this once on main)
git checkout main
mkdir C:\tmp\crosskill-before
cd C:\tmp\crosskill-before
node C:\Users\alkhu\Projects\crosskill\dist\cli.js init
node C:\Users\alkhu\Projects\crosskill\dist\cli.js build

# Now compare AFTER refactor
git checkout refactor/monorepo
cd C:\Users\alkhu\Projects\crosskill
bun run build
mkdir C:\tmp\crosskill-after
cd C:\tmp\crosskill-after
node C:\Users\alkhu\Projects\crosskill\packages\cli\dist\cli.js init
node C:\Users\alkhu\Projects\crosskill\packages\cli\dist\cli.js build

# Diff
fc /b C:\tmp\crosskill-before\AGENTS.md C:\tmp\crosskill-after\AGENTS.md
fc /b C:\tmp\crosskill-before\.claude\skills\code-reviewer\SKILL.md C:\tmp\crosskill-after\.claude\skills\code-reviewer\SKILL.md
```

If any diff appears, fix it before moving on. The refactor is a no-op for end users.

### 18. Commit + push

```bash
git add -A
git commit -m "refactor: split into monorepo (packages/core, packages/cli, packages/skills)

- Pure-TS @crosskill/core library, browser-safe (no fs imports in main entry)
- @crosskill/core/node subentry for Node-only parseSkillFile
- crosskill CLI now depends on @crosskill/core via workspace:*
- @crosskill/skills package for shared starter skill content
- Bun workspaces, shared tsconfig.base.json
- CI updated to build all packages + run smoke test from new path
- All 15 existing tests still pass
- CLI output byte-identical to v0.1.0"

git push -u origin refactor/monorepo
gh pr create --title "refactor: split into monorepo" --body "Phase 1 of the multi-surface architecture. CLI output is byte-identical to v0.1.0."
```

### 19. Merge + tag

After review (or self-merge since solo project):

```bash
gh pr merge --squash --delete-branch
git checkout main && git pull
git tag v0.2.0 -m "v0.2.0 — monorepo refactor"
git push --tags
```

---

## Phase 1 acceptance checklist

- [ ] `bun install` succeeds at the root
- [ ] `bun test` → 15/15 passing
- [ ] `bun run typecheck` → 0 errors
- [ ] `bun run build` → produces `packages/core/dist` and `packages/cli/dist`
- [ ] CLI installed from local workspace produces byte-identical outputs vs v0.1.0
- [ ] CI green on the PR
- [ ] Tag `v0.2.0` exists
- [ ] README updated to mention "Library + CLI; web + desktop coming"

---

## Risks & gotchas

1. **`gray-matter` may not be tree-shakeable for browser bundlers.** If web bundle is huge, switch to `js-yaml` + a tiny custom front-matter splitter (~30 lines). Defer to Phase 2 if not blocking.
2. **`zod` adds ~50KB gzipped to the web bundle.** Acceptable. Don't replace.
3. **Bun workspaces have rough edges.** If `workspace:*` resolution fails on a Node-only consumer, fall back to `npm` for that test only. The Bun-Node interop is a known weak area.
4. **CRLF vs LF on Windows.** Ensure `.gitattributes` enforces LF for `.ts`, `.md`, `.json`. If outputs differ only by line endings, that's the cause.

---

## What's next

Once Phase 1 is merged and tagged, move to `PLAN/03_PHASE2_WEB.md`.
