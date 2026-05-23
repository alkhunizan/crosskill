<div align="center">

# crosskill

**Write AI coding-agent skills once. Compile to every tool.**

Claude Code · Cursor · Codex (`AGENTS.md`) · Windsurf · Aider · OpenCode · Gemini CLI

[![npm](https://img.shields.io/npm/v/crosskill.svg?style=flat-square)](https://www.npmjs.com/package/crosskill)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Stars](https://img.shields.io/github/stars/azizme-com/crosskill?style=flat-square)](https://github.com/azizme-com/crosskill/stargazers)
[![CI](https://img.shields.io/github/actions/workflow/status/azizme-com/crosskill/ci.yml?style=flat-square)](https://github.com/azizme-com/crosskill/actions)

</div>

---

## The problem

You use Claude Code at work, Cursor at home, Codex on a server, and Aider in the terminal.

Every one of them wants its own skill / rules / instructions file:

```
.claude/skills/code-review.md
.cursor/rules/code-review.mdc
AGENTS.md
.windsurf/rules.md
.aider.conf.yml
.opencode/skills/code-review.md
```

So you copy-paste. You forget one. They drift. You can't share. Your team can't enforce.

**crosskill** fixes that. Write a skill once. Compile to all of them.

## Install

```bash
npx crosskill init
```

That's it. No keys. No accounts. No Docker. No services.

## Usage

```bash
# 1. Scaffold a skill in your repo
npx crosskill init

# 2. Edit ./crosskill/code-reviewer.skill.md

# 3. Compile to every target tool you use
npx crosskill build

# 4. Lint before shipping
npx crosskill lint

# 5. In CI: verify outputs match crosskill.lock
npx crosskill check

# 6. Install a community skill
npx crosskill add aziz/najdi-writer
```

## What gets generated

From one `code-reviewer.skill.md`:

```
✓ .claude/skills/code-reviewer/SKILL.md
✓ .cursor/rules/code-reviewer.mdc
✓ AGENTS.md                    (Codex / OpenAI)
✓ .windsurf/rules/code-reviewer.md
✓ .aider/skills/code-reviewer.md
✓ .opencode/skills/code-reviewer.md
✓ .gemini/skills/code-reviewer.md
```

All from this:

````md
---
name: code-reviewer
version: 0.1.0
description: Review code for bugs, performance, and style issues
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

1. Identify bugs and edge cases — line by line.
2. Suggest performance improvements with measured impact.
3. Flag style and consistency issues, link to the project style guide.
4. Output a structured review: `## Bugs`, `## Performance`, `## Style`, `## Nits`.

## Examples

**Input:** a Python function with a race condition.
**Output:** flag the shared mutable state, propose a lock or queue, show the patch.
````

## Why crosskill

- **Cross-platform from day one.** One spec, many compilers. Drop in new targets as the ecosystem evolves.
- **Local-first.** No LLM required to use crosskill itself. Compile and lint are deterministic.
- **One-liner install.** `npx crosskill init`. No keys, no Docker, no services.
- **Versionable.** Skills get a `version`, a lockfile, and reproducible builds across your team.
- **Lintable.** Catches vague verbs, missing examples, format ambiguity, length issues.
- **Starter pack included.** 10+ production-ready skills shipped in `./skills/`.

## Built-in skills

Run `npx crosskill add @crosskill/<name>` to drop any of these into your repo:

| Skill | What it does |
|---|---|
| `code-reviewer` | Structured code review with bugs / perf / style sections |
| `commit-message` | Conventional Commits with scoped subjects |
| `pr-summarizer` | PR descriptions with context, changes, risks, screenshots |
| `test-writer` | Unit & integration tests with edge cases |
| `refactor-helper` | Targeted refactors that respect existing patterns |
| `doc-writer` | README, docstrings, API docs |
| `debug-buddy` | Reproduce + isolate + minimal repro |
| `readme-generator` | Polished READMEs that ship traffic |
| `api-designer` | REST + GraphQL endpoint design with examples |
| `arabic-najdi-writer` | Saudi Najdi-dialect copywriting & content |

## Supported targets

| Tool | Status | Output |
|---|---|---|
| Claude Code | ✅ Stable | `.claude/skills/<name>/SKILL.md` |
| Cursor | ✅ Stable | `.cursor/rules/<name>.mdc` |
| Codex / OpenAI | ✅ Stable | `AGENTS.md` |
| Windsurf | ✅ Stable | `.windsurf/rules/<name>.md` |
| Aider | ✅ Stable | `.aider/skills/<name>.md` |
| OpenCode | ✅ Stable | `.opencode/skills/<name>.md` |
| Gemini CLI | ✅ Stable | `.gemini/skills/<name>.md` |
| Copilot Workspace | ✅ Stable | `.github/copilot-instructions.md` |
| Continue.dev | ✅ Stable | `.continue/<name>.md` |
| Zed Assistant | 🚧 Planned | — |
| Cline | 🚧 Planned | — |

Want another target? [Open an issue](https://github.com/azizme-com/crosskill/issues/new?template=new-target.md).

## Skill format (`*.skill.md`)

```yaml
---
name: string                  # kebab-case, unique
version: string               # semver, e.g. 0.1.0
description: string           # one line, under 120 chars
author?: string               # github handle or name
tags?: string[]               # for registry search
license?: string              # SPDX id, defaults to MIT
targets:
  claude?: boolean
  cursor?: boolean
  codex?: boolean
  windsurf?: boolean
  aider?: boolean
  opencode?: boolean
  gemini?: boolean
tools?: string[]              # tools the skill expects (read_file, grep, etc)
inputs?: string[]             # named inputs the skill consumes
---

# Body: the actual prompt / instructions in Markdown
```

Full spec: [docs/format.md](./docs/format.md).

## Config (`crosskill.config.json`)

```json
{
  "skillsDir": "./crosskill",
  "outputs": {
    "claude": ".claude/skills",
    "cursor": ".cursor/rules",
    "codex": "AGENTS.md",
    "windsurf": ".windsurf/rules",
    "aider": ".aider/skills",
    "opencode": ".opencode/skills",
    "gemini": ".gemini/skills"
  },
  "lint": {
    "minBodyLength": 80,
    "maxBodyLength": 8000,
    "requireExamples": true
  }
}
```

## Roadmap

- [x] Compilers for 7 platforms
- [x] Lint command
- [x] 10 built-in skills
- [ ] `crosskill test` — golden-output assertions against local Ollama
- [x] `crosskill.lock` for reproducible team builds (`crosskill build` writes; `crosskill check` / `build --frozen` verifies)
- [ ] [crosskill.dev](https://crosskill.dev) — public skill registry & search
- [ ] GitHub Action for skill CI on PRs
- [ ] VS Code & Cursor extension with live multi-target preview
- [ ] Private team registries (optional paid tier)

## Contributing

PRs welcome — especially new compiler targets. See [CONTRIBUTING.md](./CONTRIBUTING.md).

Easiest first PR: **add a new starter skill** to `./skills/`.

## License

[MIT](./LICENSE) © [Aziz Al-Khunizan](https://azizme.com)

---

<div align="center">

**One skill. Every tool. No lock-in.**

[Website](https://crosskill.dev) · [Skill Registry](https://crosskill.dev/skills) · [Docs](./docs) · [Twitter](https://twitter.com/azizme_com)

</div>
