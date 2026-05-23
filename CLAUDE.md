# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

`crosskill` is a deterministic CLI compiler that turns one skill source (`*.skill.md`, Markdown + YAML front-matter) into platform-specific outputs for every major AI coding agent (Claude Code, Cursor, Codex/`AGENTS.md`, Windsurf, Aider, OpenCode, Gemini CLI). It runs locally — no LLM, no network, no services. Written in TypeScript, built with Bun, tested with `bun:test`.

## Commands

Toolchain is **Bun** (not npm/pnpm).

- `bun install` — install dependencies
- `bun run build` — bundles `src/cli.ts` and `src/index.ts` into `dist/` (`bun build --target node`)
- `bun run dev` — `bun --watch ./src/cli.ts` for an iterative CLI dev loop
- `bun test` — run the full suite under `tests/`
- `bun test tests/compilers.test.ts` — run a single test file
- `bun test -t "claude compiler"` — filter by test name
- `bun run typecheck` — `tsc --noEmit`
- `bun run format` — prettier on `src/**/*.ts`
- `bun src/cli.ts <subcommand>` — run the CLI from source during dev (the published binary is `dist/cli.js`)

## Architecture

Everything flows through one tiny contract defined in [src/schema.ts](src/schema.ts):

- `Skill = { frontmatter, body, sourcePath }` — `body` is the literal prompt text.
- `Compiler = { target, defaultOutputPath, compile(skill, outputRoot) → CompileResult }` — every target conforms.

### Pipeline

1. **Parser** ([src/parser.ts](src/parser.ts)) — `gray-matter` + zod (`SkillFrontmatterSchema`). Throws `SkillParseError` with a human-readable list of issues. An empty body is a hard error.
2. **Compiler registry** ([src/compilers/index.ts](src/compilers/index.ts)) — `COMPILERS: Record<SupportedTarget, Compiler | undefined>`. `copilot` and `continue` are intentionally `undefined` placeholders (schema accepts them, build skips them).
3. **Build** ([src/commands/build.ts](src/commands/build.ts)) — walks `skillsDir`, parses each skill, dispatches to each enabled target's compiler, writes the file.
4. **Linter** ([src/linter.ts](src/linter.ts)) — rules: `min-body-length`, `max-body-length`, `require-examples` (looks for an `## Examples` header), `vague-language` (info, blocklist at top of file), `no-targets` (error), `short-description` (info). Defaults in `DEFAULT_LINT_CONFIG`; overridable via the `lint` key in `crosskill.config.json`.
5. **CLI** ([src/cli.ts](src/cli.ts)) — thin Commander wrapper over four commands in `src/commands/`: `init`, `build`, `lint`, `add`.

### Load-bearing things that aren't obvious from a glance

- **`AGENTS.md` is special.** The codex compiler returns a *section per skill*, not a complete file. `buildCommand` aggregates all codex sections into a single `AGENTS.md` with a header and `---` separators — see [src/commands/build.ts:82-118](src/commands/build.ts#L82-L118). Every other target writes one output file per skill. If you add another target that uses a single shared file, extend this aggregation branch.
- **Skill file discovery accepts two patterns.** `findSkillFiles` ([src/commands/build.ts:27](src/commands/build.ts#L27), mirrored in [src/commands/lint.ts:22](src/commands/lint.ts#L22)) picks up both `*.skill.md` (user files, conventional in `./crosskill/`) and bare `skill.md` (the bundled starters in `./skills/<name>/`).
- **`add` only resolves built-in starters today.** [src/commands/add.ts](src/commands/add.ts) accepts `code-reviewer` or `@crosskill/code-reviewer` and copies from `./skills/<name>/skill.md`. The README's `aziz/najdi-writer` registry syntax is **not yet implemented** — the registry is a roadmap item. The path-resolution tries several candidate locations so it works from both `dist/` (published) and `src/` (dev) layouts.
- **Public library API.** [src/index.ts](src/index.ts) re-exports `parseSkillFile`, `lintSkill`, `COMPILERS`, and the schema types for downstream embedders. Treat it as a stable surface.

### Adding a new compiler target

1. Add the name to `SUPPORTED_TARGETS` and `TargetsSchema` in [src/schema.ts](src/schema.ts).
2. Create `src/compilers/<target>.ts` exporting a `Compiler` impl.
3. Register it in `COMPILERS` in [src/compilers/index.ts](src/compilers/index.ts).
4. Add a case to [tests/compilers.test.ts](tests/compilers.test.ts).
5. If the target writes to a single shared file (like `AGENTS.md`), extend the aggregation branch in [src/commands/build.ts:97](src/commands/build.ts#L97).

## Conventions

- **ESM with `.js` import suffix.** `package.json` declares `"type": "module"`, and every TypeScript import inside `src/` uses the `.js` suffix (e.g. `from "./parser.js"`) even though sources are `.ts`. Preserve this — the Bun bundler and Node ESM resolver both depend on it.
- **Compiler outputs are pure functions of the skill + `outputRoot`.** Don't read or mutate the filesystem inside a `compile()`. Only `build.ts` does I/O.
