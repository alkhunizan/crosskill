# Changelog

All notable changes follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] — 2026-05-23

### Changed
- **Monorepo refactor.** The single-package repo is now a Bun workspace with three
  packages: `@crosskill/core` (the pure-TS compiler library), `crosskill` (the CLI
  binary, depends on core via `workspace:*`), and `@crosskill/skills` (starter skills).
- **Browser-safe core entry.** `@crosskill/core` no longer imports `fs`, `path`, or
  any Node-only built-in from its main entry. The Node-side helpers
  (`parseSkillFile`, `loadConfig`, lockfile / snapshot IO, resolvers, runners) live
  at the `@crosskill/core/node` sub-entry so the web playground can import the
  compiler without dragging Node polyfills into the browser bundle.

### Verified
- All 85 existing tests still pass.
- `crosskill init && crosskill build` produces byte-identical output to v0.1.0.

## [0.1.0] — 2026-05

### Added
- Initial CLI release with 9 compiler targets (Claude Code, Cursor, Codex /
  `AGENTS.md`, Windsurf, Aider, OpenCode, Gemini CLI, Copilot Workspace,
  Continue.dev).
- `crosskill init`, `build`, `lint`, `add`, `check`, `test` commands.
- `crosskill.lock` reproducible-build support; `crosskill check` for CI drift
  detection.
- 10 production-ready starter skills.
- Composite GitHub Action at `.github/actions/crosskill/action.yml`.
