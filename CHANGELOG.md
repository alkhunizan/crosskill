# Changelog

All notable changes follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.0] — 2026-05-23

### Added
- **Desktop app at `apps/desktop/`** built on Tauri 2 + Vite + React. Same
  `@crosskill/core` compiler, but now with native file-system access and a
  workspace-aware UI.
  - **Open folder** uses Tauri's native picker and a Rust-side `walkdir` scan
    (depth 6, skips `node_modules` / `.git` / `dist` / `build` / `.next` /
    `target` / `out`).
  - **Save** writes every compiled output for the active skill plus the skill
    source itself, batched in one Rust call.
  - **Watch** spins up a `notify` recursive watcher on the workspace root.
    The Rust side filters for `*.skill.md` changes and emits `skill-changed`
    events the UI uses to reload.
  - **Path-traversal guard** in `write_outputs` refuses any path containing
    `..` or an absolute prefix and verifies the canonical parent is still
    inside the canonical workspace root.
  - **Cmd/Ctrl+S** keyboard save.
  - **System tray** with crosskill tooltip.
- **`release.yml` GitHub Actions workflow.** Tag push (`v*`) builds Tauri
  installers on `windows-latest` / `macos-latest` (universal) /
  `ubuntu-22.04`, attaches `.msi` / `.dmg` / `.AppImage` / `.deb` to a draft
  GitHub Release, and (when `NPM_TOKEN` is set) publishes `@crosskill/core`,
  `crosskill`, `@crosskill/skills` to npm.

### Verified
- `cargo check` of the Rust side compiles cleanly with zero warnings.
- 85/85 tests still pass; typecheck clean for core / cli / web / desktop.

## [0.3.0] — 2026-05-23

### Added
- **Web playground at `apps/web/`** — Next.js 14 with static export, deployable to
  any static host. Monaco editor + live compile preview + 7-tab output strip +
  starter gallery + lz-string share URLs + JSZip "Download ZIP" of every
  compiled output.
- **Browser bundle of `@crosskill/core`** at `dist/browser/index.js`. The
  `exports` map and `browser` field point bundlers at it automatically; Next's
  Webpack alias forces it explicitly. Node consumers still get the original
  `dist/index.js`.
- **Portable path join** in `packages/core/src/path-portable.ts`. Compilers
  no longer import `node:path`, which was blocking the browser build (Webpack 5
  refuses to resolve `node:` URIs). POSIX-only join, which Windows still
  accepts on filesystem writes; the lockfile was already POSIX via
  `toPosixPath()`.
- `prebuild` + `predev` hook in `apps/web/` copies starter skills out of
  `packages/skills/` into `public/skills/` so the static site can fetch them
  without a backend.

### Changed
- Workspace `build`/`typecheck` scripts now include the web app behind a
  separate `build:web` target so CI can build CLI-only or full-tree as needed.

### Verified
- 85/85 tests still pass; typecheck clean across all three packages.
- Compiled skill outputs (Claude/Cursor/AGENTS.md/etc.) remain byte-identical
  to v0.1.0; lockfile `crosskillVersion` bumps to `0.3.0`.
- Static export builds clean with zero `node:` schemes in the client bundle.

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
