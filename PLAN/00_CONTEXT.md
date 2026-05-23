# 00 — Project Context

## What is crosskill?

> Write AI coding-agent skills once. Compile to every tool.

A deterministic TypeScript compiler that takes one `*.skill.md` file and emits skill/rules/instructions files for every major AI coding tool — Claude Code, Cursor, Codex (`AGENTS.md`), Windsurf, Aider, OpenCode, Gemini CLI.

**Positioning:** crosskill is to AI coding agents what `npm` is to JavaScript bundlers, or `prettier` is to code style — *infrastructure that the AI tools themselves depend on*, not yet another AI wrapper.

## Why this project exists

From a research analysis of the top 500 GitHub trending repos in May 2026:

- **89%** of trending repos are AI agents or RAG/memory tools (a monoculture).
- **27%** are platform-locked skill collections — packs of skills that only work in one tool (e.g. only Cursor, only Claude Code).
- **5%** of repos attempt to be cross-tool. The ones that do (e.g. `graphify` at 52k ⭐) trend extremely fast.
- **93%** of trending repos fail the "one-line install" test.
- **70%** lack runnable examples.
- **4%** of repos meet a basic quality bar (tests + CI + examples + demo + docs).

The market has 444 AI agent wrappers and 0 standardized skill formats. crosskill claims the meta-layer.

## What already exists (as of handoff)

**Status: Phase 0 complete. CLI v0.1.0 working end-to-end.**

### Working features

- `crosskill init` — scaffolds `crosskill.config.json` + a sample `*.skill.md`
- `crosskill build` — compiles every skill to every enabled target
- `crosskill lint` — runs static checks on all skills
- `crosskill add <name>` — copies a starter skill into the user's repo

### Compilers shipped (7)

| Target | Output path |
|---|---|
| Claude Code | `.claude/skills/<name>/SKILL.md` |
| Cursor | `.cursor/rules/<name>.mdc` |
| Codex / OpenAI | `AGENTS.md` (single file, sections) |
| Windsurf | `.windsurf/rules/<name>.md` |
| Aider | `.aider/skills/<name>.md` |
| OpenCode | `.opencode/skills/<name>.md` |
| Gemini CLI | `.gemini/skills/<name>.md` |

### Quality bar

- 15 passing tests (parser, compilers, linter) via Bun test
- GitHub Actions CI on Node 18/20/22
- Smoke test in CI: actually runs `init → build → lint` end-to-end
- TypeScript strict mode, zero `any`
- MIT license, CONTRIBUTING.md, CODE_OF_CONDUCT.md
- README with feature table, examples, roadmap

### Starter skills shipped (4)

- `code-reviewer` — structured code review
- `commit-message` — Conventional Commits from a diff
- `pr-summarizer` — PR descriptions with context, changes, risks
- `arabic-najdi-writer` — Saudi Najdi-dialect copywriting

## Tech stack (current)

- **Runtime:** Node 18+
- **Language:** TypeScript 5.x, strict mode
- **Bundler / scripts:** Bun (but the built artifact runs on Node)
- **Schema validation:** Zod
- **Markdown parsing:** gray-matter
- **CLI:** commander + kleur + prompts
- **Tests:** Bun test (no Jest/Vitest)

## Repository layout (current — pre-monorepo)

```
crosskill/
├── package.json
├── tsconfig.json
├── README.md
├── LICENSE
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── .gitignore
├── src/
│   ├── cli.ts              CLI entry (commander)
│   ├── index.ts            Library exports
│   ├── schema.ts           Zod schema + types
│   ├── parser.ts           Skill file parser
│   ├── linter.ts           Lint rules
│   ├── compilers/
│   │   ├── index.ts
│   │   ├── claude.ts
│   │   ├── cursor.ts
│   │   ├── agents-md.ts    (Codex target)
│   │   ├── windsurf.ts
│   │   ├── aider.ts
│   │   ├── opencode.ts
│   │   └── gemini.ts
│   └── commands/
│       ├── init.ts
│       ├── build.ts
│       ├── lint.ts
│       └── add.ts
├── skills/
│   ├── code-reviewer/skill.md
│   ├── commit-message/skill.md
│   ├── pr-summarizer/skill.md
│   └── arabic-najdi-writer/skill.md
├── examples/
│   └── basic/
│       ├── README.md
│       └── hello-world.skill.md
├── tests/
│   ├── parser.test.ts
│   ├── compilers.test.ts
│   └── linter.test.ts
├── docs/
│   ├── format.md           Skill format spec
│   └── targets.md          Target reference
├── .github/
│   └── workflows/
│       └── ci.yml
└── dist/                   Build output (gitignored)
```

## Why three surfaces (and only three)

| Surface | Audience | Funnel position | Cost |
|---|---|---|---|
| **CLI** (`npx crosskill`) | Power users, CI/CD, build pipelines | High intent, low volume | Free |
| **Web** (`crosskill.dev`) | First-time visitors, demo traffic, no-install try-path | High volume, lowest friction | Free (static) |
| **Desktop** (`crosskill.app`) | Teams, working professionals, watch-mode users | Highest engagement, retention | Free |
| **Library** (`@crosskill/core`) | Other dev-tool builders embedding the compiler | Long tail, downstream | Free |

This is the proven multi-surface pattern used by Raycast, Linear, Fig, TablePlus. The mistake to avoid: building a single surface and forcing every user through it.

## Out of scope (do not build)

- ❌ Cloud sync / hosted registry of skills (V3+ roadmap, not now)
- ❌ Team / private skill registries (paid feature, V3+)
- ❌ LLM-powered skill generation in the build path
- ❌ Skill marketplace with payments
- ❌ User accounts of any kind
- ❌ Telemetry (the project ships with zero phone-home)
- ❌ Backends, databases, auth — none needed for any of the three surfaces

If you find yourself building any of these, stop. Re-read this section.
