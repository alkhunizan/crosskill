# 01 — Architecture

## The big picture

```
                ┌────────────────────────────┐
                │   *.skill.md (user input)  │
                │   YAML frontmatter + body  │
                └────────────┬───────────────┘
                             │
                             ▼
              ┌─────────────────────────────────┐
              │     @crosskill/core             │
              │     (pure TypeScript library)   │
              │                                 │
              │   parse  →  validate  →  lint   │
              │           │                     │
              │           ▼                     │
              │      compile per target         │
              │      (returns {path, content})  │
              └─────┬──────────┬───────┬────────┘
                    │          │       │
        ┌───────────┘          │       └────────────┐
        ▼                      ▼                    ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────────┐
│ packages/cli   │  │ apps/web       │  │ apps/desktop       │
│                │  │                │  │                    │
│ Node + fs      │  │ Next.js 14     │  │ Tauri 2 + WebView  │
│ writes files   │  │ Monaco editor  │  │ Reuses web UI      │
│ to disk        │  │ JSZip download │  │ + native FS access │
│                │  │ static export  │  │ + watch mode       │
└────────────────┘  └────────────────┘  └────────────────────┘
   npm:               crosskill.dev       crosskill.app
   crosskill          (Netlify static)    (GitHub Releases)
```

## Core architectural principle

> **The library does not know where things go. It just produces `(path, content)` pairs.**

Every consumer (CLI, web, desktop) decides what to *do* with those pairs:

- CLI writes them to disk via `fs.writeFileSync`.
- Web puts them in an in-memory map, lets the user download as ZIP via JSZip.
- Desktop writes them to disk via Tauri's `@tauri-apps/api/fs` (which uses Rust-side IO).

This is the **single most important design decision**. It's what lets the same compiler ship to three places.

## Final monorepo layout (target end-state)

```
crosskill/
├── package.json              ← workspace root, no deps of its own
├── bun.lock
├── tsconfig.base.json        ← shared TS settings
├── README.md
├── LICENSE
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── PLAN/                     ← this folder (handoff docs)
├── packages/
│   ├── core/                 ← @crosskill/core — pure TS library
│   │   ├── package.json      (name: "@crosskill/core")
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts      (public API)
│   │   │   ├── schema.ts
│   │   │   ├── parser.ts
│   │   │   ├── linter.ts
│   │   │   └── compilers/
│   │   │       ├── index.ts
│   │   │       ├── claude.ts
│   │   │       ├── cursor.ts
│   │   │       ├── agents-md.ts
│   │   │       ├── windsurf.ts
│   │   │       ├── aider.ts
│   │   │       ├── opencode.ts
│   │   │       └── gemini.ts
│   │   └── tests/
│   │       ├── parser.test.ts
│   │       ├── compilers.test.ts
│   │       └── linter.test.ts
│   │
│   ├── cli/                  ← crosskill (npm)
│   │   ├── package.json      (name: "crosskill", bin: { crosskill })
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── cli.ts
│   │       └── commands/
│   │           ├── init.ts
│   │           ├── build.ts
│   │           ├── lint.ts
│   │           └── add.ts
│   │
│   └── skills/               ← starter skill content (no code)
│       ├── package.json      (name: "@crosskill/skills", type: "module")
│       ├── code-reviewer/skill.md
│       ├── commit-message/skill.md
│       ├── pr-summarizer/skill.md
│       ├── arabic-najdi-writer/skill.md
│       ├── test-writer/skill.md
│       ├── refactor-helper/skill.md
│       ├── doc-writer/skill.md
│       ├── debug-buddy/skill.md
│       ├── readme-generator/skill.md
│       └── api-designer/skill.md
│
├── apps/
│   ├── web/                  ← crosskill.dev
│   │   ├── package.json
│   │   ├── next.config.mjs   (output: 'export')
│   │   ├── tailwind.config.ts
│   │   ├── postcss.config.mjs
│   │   ├── tsconfig.json
│   │   ├── public/
│   │   ├── netlify.toml
│   │   └── app/
│   │       ├── layout.tsx
│   │       ├── page.tsx              ← the playground
│   │       ├── globals.css
│   │       ├── lib/
│   │       │   ├── monaco-setup.ts
│   │       │   ├── zip-output.ts     (JSZip wrapper)
│   │       │   └── share-url.ts      (URL hash encoding)
│   │       └── components/
│   │           ├── Editor.tsx
│   │           ├── OutputTabs.tsx
│   │           ├── DownloadZip.tsx
│   │           ├── ShareButton.tsx
│   │           ├── StarterGallery.tsx
│   │           └── Lint.tsx
│   │
│   └── desktop/              ← crosskill.app (Tauri 2)
│       ├── package.json
│       ├── tsconfig.json
│       ├── tauri.conf.json   ← Tauri config
│       ├── src-tauri/        ← Rust side
│       │   ├── Cargo.toml
│       │   ├── tauri.conf.json
│       │   ├── icons/
│       │   ├── build.rs
│       │   └── src/
│       │       ├── main.rs
│       │       ├── fs_bridge.rs       (open folder, scan targets, write outputs)
│       │       ├── watcher.rs         (notify crate, file-watch)
│       │       └── menu.rs            (system tray)
│       └── src/              ← Vite + React UI (or reuse apps/web via symlink)
│           ├── main.tsx
│           ├── App.tsx
│           ├── lib/
│           │   └── tauri-fs.ts        (Tauri-specific file writer)
│           └── (components shared with apps/web)
│
├── examples/
│   └── basic/...
├── docs/
│   ├── format.md
│   └── targets.md
└── .github/
    └── workflows/
        ├── ci.yml            (test + build all packages)
        └── release.yml       (build + sign + publish desktop installers on tag)
```

## Workspace tooling

- **Package manager:** Bun (with `workspaces` field in root `package.json`)
- Why not pnpm: Aziz already uses Bun for this project. Sticking with one runtime.
- Why not Turborepo: overkill for 3 packages + 2 apps. Plain Bun workspaces are enough.

## Public API contract (the most important file)

The `@crosskill/core` library exports exactly this surface. Every consumer uses this and nothing else:

```ts
// packages/core/src/index.ts

// Parser
export function parseSkillString(raw: string, sourcePath?: string): Skill;
export function parseSkillFile(filePath: string): Skill;   // CLI/desktop only — uses fs
export class SkillParseError extends Error { ... }

// Linter
export function lintSkill(skill: Skill, config?: LintConfig): LintIssue[];
export const DEFAULT_LINT_CONFIG: LintConfig;
export type { LintIssue, LintConfig };

// Compilers
export function compileSkill(skill: Skill, outputRoot?: string): CompileResult[];
export function compileSkills(skills: Skill[], outputRoot?: string): CompileResult[];
export const COMPILERS: Record<SupportedTarget, Compiler>;
export function getCompiler(target: SupportedTarget): Compiler | undefined;

// Types & schema
export { SkillFrontmatterSchema, SUPPORTED_TARGETS } from './schema.js';
export type {
  Skill,
  SkillFrontmatter,
  SupportedTarget,
  Compiler,
  CompileResult,
} from './schema.js';
```

**Key insight:** `parseSkillFile` is the *only* function that touches `fs`, and it's a thin wrapper over `parseSkillString`. In the web app, only `parseSkillString` is used.

Splitting fs-touching code into its own optional entry point keeps the rest browser-safe.

## Data flow per surface

### CLI

```
user runs `crosskill build`
  → loads crosskill.config.json from cwd
  → globs `polyskill/**/*.skill.md`
  → for each file:
      parseSkillFile() → Skill
      compileSkill(skill, cwd) → CompileResult[]
      for each result: fs.mkdirSync + fs.writeFileSync
  → prints summary to terminal
```

### Web

```
user pastes text in Monaco editor
  → on debounced change:
      parseSkillString(text) → Skill or error
      lintSkill(skill) → issues (shown inline)
      compileSkill(skill, '') → CompileResult[]
      render tabs with content
  → user clicks "Download ZIP":
      JSZip builds a tree from results
      browser triggers download of crosskill-outputs.zip
  → user clicks "Share":
      hash-encode the skill source
      copy URL `https://crosskill.dev/#s=<base64>` to clipboard
```

### Desktop

```
user clicks "Open Folder"
  → Tauri dialog → selected path
  → Rust scans for .skill.md files + existing target dirs
  → JS side calls parseSkillString on each
  → UI renders multi-file editor (left), live preview (right)
  → on save: invokes Tauri `write_compile_outputs` command
      → Rust writes all CompileResult to disk
  → optional: user toggles "Watch" → Rust starts notify watcher
      → on .skill.md change → recompile → rewrite outputs
```

## Why Tauri 2 (not Electron)

| | Tauri 2 | Electron |
|---|---|---|
| Installer size | 3–10 MB | 150+ MB |
| RAM (idle) | ~50 MB | ~300 MB |
| Cold start | <1 sec | 2–4 sec |
| Built-in updater | ✅ | manual |
| Code signing tooling | ✅ | manual |
| Cross-platform CI templates | ✅ official | manual |
| Reuses Next.js UI | ✅ | ✅ |

Tauri uses the OS's native webview (WebView2 on Win, WKWebView on Mac, WebKitGTK on Linux), so the app is just our Next.js UI bundled with a thin Rust shell that handles file system + watcher + tray.

## Why static-export Next.js (not Vite, not Remix)

- Aziz already uses Next.js (azizme.com). Keeps mental model consistent.
- `output: 'export'` produces a fully static site — no server, no Node runtime, no Vercel/Netlify functions.
- Tauri loads the static build for the desktop app too — same code, two surfaces.
- Easy custom domains on Netlify.

## Compatibility matrix

| Surface | Runs offline | Needs install | File-system access | Bundle size |
|---|---|---|---|---|
| CLI | ✅ | ✅ Node | Full | npm package <100 KB |
| Web | ✅ after first load | ❌ | ZIP download only | ~800 KB initial JS |
| Desktop | ✅ | ✅ single installer | Full + watch | ~6 MB installer |

## Versioning strategy

- `@crosskill/core` and `crosskill` (CLI) share a version number. Bump in lockstep.
- `@crosskill/skills` versioned independently (content changes don't require CLI bumps).
- `apps/web` and `apps/desktop` follow the core version for clarity.
- Use Conventional Commits. Use `git tag vX.Y.Z` to trigger release CI.

## Release artifacts per tag

A tag like `v0.3.0` triggers:

1. `bun run build` for every package
2. `npm publish` for `@crosskill/core`, `crosskill`, `@crosskill/skills`
3. `bun run build` + `next export` for `apps/web` → Netlify deploys automatically from GitHub
4. Tauri builds for `apps/desktop` on Windows + macOS + Linux runners → GitHub Release with installer attachments
5. Update `crosskill.app` landing page to point to the new release

CI handles all of this — see `PLAN/07_OPERATIONS.md`.
