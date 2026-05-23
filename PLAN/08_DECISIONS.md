# 08 — Decisions & Defaults

Every ambiguous choice has a default. When in doubt, follow this table. Don't ask Aziz unless the cost of being wrong is irreversible (data loss, money spent, public commitment).

---

## Architecture defaults

| Question | Default | Reasoning |
|---|---|---|
| Monorepo tool | **Bun workspaces** | Already in stack; minimal |
| Module system | **ESM only** | Modern toolchains; no CJS interop needed |
| Bundler for CLI | **Bun build → Node target** | Already proven in v0.1.0 |
| Bundler for web | **Next.js with `output: 'export'`** | Static, no backend, easy Netlify deploy |
| Bundler for desktop | **Vite (via Tauri)** | Tauri's recommended path |
| Schema validation | **Zod** | Already in stack; great DX |
| YAML parser | **gray-matter** (which uses `js-yaml`) | Already in stack |
| State management (web) | **Local React state** | One-page app; no global state needed |
| State management (desktop) | **Local React state + Tauri events** | Same |
| Styling | **Tailwind v4 with CSS variables** | Aziz uses it everywhere |
| Icons | **lucide-react** | Already in Aziz's stack |
| Testing | **Bun test** | Already proven; no Jest/Vitest |
| Linting | **None for now, only `tsc` + Prettier** | Don't add ESLint complexity |
| Code formatting | **Prettier defaults** | Zero-config; consistent |

---

## Product defaults

| Question | Default | Reasoning |
|---|---|---|
| Light/dark mode | **Dark only for v0.4** | 90% of devs use dark; less work; ship faster |
| Web app i18n | **EN only for v0.4** | Najdi later in v0.5 |
| Auth / accounts | **None, ever (for OSS core)** | Stay infrastructure |
| Telemetry | **None** | Strong differentiator |
| Mobile support | **Works, not optimized** | Devs use desktop; not the target |
| Browser support | **Last 2 versions of Chrome/Edge/Firefox/Safari** | Modern devs |
| Node support | **18+** | Already minimum in v0.1.0 |
| Tauri minimum OS | **Win 10 (WebView2), macOS 11, Ubuntu 20.04+** | Tauri 2 defaults |
| Tauri auto-update | **Enabled but ineffective until v0.5** | First user-installed version needs the manifest format |
| Code signing (Windows) | **Skip for v0.4; add when stars > 1000** | Cost vs benefit |
| Code signing (macOS) | **Skip for v0.4; add when stars > 1000** | Same |
| AppImage signing | **Skip (not standard on Linux)** | Skip permanently |

---

## API & format defaults

| Question | Default | Reasoning |
|---|---|---|
| Skill filename pattern | **`*.skill.md`** primary, `skill.md` (in a folder) accepted | Already in v0.1.0 |
| Skill name format | **kebab-case** | Already in schema |
| Default version | **`0.1.0`** | Sensible OSS default |
| Default license | **MIT** | Skill metadata, not project license |
| AGENTS.md output behavior | **Single file, multiple sections separated by `---`** | Standard pattern |
| When no compiler exists for a target | **Skip silently, count as "skipped"** | Don't block build |
| When skill body is empty | **Error (do not compile)** | Empty body = useless skill |
| When no targets enabled | **Error (do not compile)** | Same reason |
| Path separator in CompileResult.outputPath | **OS-native (use `path.join`)** | Already in v0.1.0 |
| Output line endings | **LF** (force via .gitattributes for source; OS-native for build outputs) | Predictability |

---

## CLI defaults

| Question | Default | Reasoning |
|---|---|---|
| Default skills dir | **`./polyskill`** (current); plan to support `./skills`, `./crosskill` as aliases | Don't break v0.1.0 users |
| Init creates a sample skill? | **Yes** (code-reviewer) | Better first-run experience |
| Build mode | **Compile-all** (no per-skill flag for v0.4) | Simpler API; add `--only <name>` later if asked |
| Watch mode in CLI | **No** (desktop has it) | Don't duplicate; CLI is for CI |
| Logs | **Brief by default**; add `--verbose` for more | Don't spam |
| Color | **Auto-detect TTY** (kleur handles this) | Standard |

---

## Web defaults

| Question | Default | Reasoning |
|---|---|---|
| Debounce on editor changes | **150ms** | Feels live without flicker |
| Default skill loaded on first visit | **code-reviewer** | Same as CLI's `init` sample |
| Share URL format | **`/#s=<lz-string-compressed>`** | Survives URL char limits |
| ZIP filename | **`crosskill-outputs-{skill-name}.zip`** | Identifiable |
| Maximum source length | **64 KB** (refuse to compile beyond this) | Protect against pasted PDFs |
| Maximum target outputs | **No cap** | A skill with 100 targets would still compile, just slow |
| Error display | **Inline below status bar, single line + tooltip for full** | Don't clutter editor |

---

## Desktop defaults

| Question | Default | Reasoning |
|---|---|---|
| Window default size | **1280 × 800** | Fits 13" laptop with breathing room |
| Window minimum size | **900 × 600** | Layout breaks below this |
| Restore window position on relaunch | **Yes** (`tauri-plugin-window-state`) | Standard expectation |
| Start watch mode by default | **No** | Opt-in for safety |
| File-watcher depth | **Recursive, max 4 levels** | Skips deep node_modules |
| Files to ignore in scan | **`node_modules/`, `.git/`, `dist/`, `build/`, `.next/`** | Standard noise |
| Save on Ctrl+S | **Yes** | Universal |
| Save on lose-focus (autosave) | **No** for v0.4 | Add in v0.5 if requested |
| Multi-window | **No** | One window per workspace; relaunch for second |
| System tray | **Yes, minimal** | Just an icon + "Quit" option |

---

## Naming choices

| Item | Name | Why |
|---|---|---|
| Project name | **crosskill** | Cross-tool + skills, available, memorable |
| Web domain | **crosskill.dev** | $9.99, available |
| Desktop landing domain | **crosskill.app** | $9.99, available, redirects to web |
| npm CLI package | **crosskill** | Matches binary name |
| npm core package | **@crosskill/core** | Scoped, clean |
| npm skills package | **@crosskill/skills** | Scoped, clean |
| Tauri app identifier | **dev.crosskill.desktop** | Matches domain reverse |
| GitHub repo | **alkhunizan/crosskill** | Aziz's account, simple name |
| Skill file extension | **`.skill.md`** | Discoverable, clear |
| Default skills dir name | **`polyskill/`** for legacy support, `skills/` accepted | Don't break v0.1.0 |

---

## When to ask Aziz vs decide yourself

**Always decide yourself:**
- Code style / naming / file organization
- Which library to use for a given purpose
- Wording in error messages / status text / docs
- Order of features within a phase
- Visual polish details

**Ask Aziz (with a default proposed):**
- Spending money (domains, certs, paid services)
- Public commitments (launch date, ProductHunt scheduling)
- Anything that touches his personal accounts (npm, Apple ID, etc.)
- Brand/voice questions where his Najdi expertise matters

**Never ask Aziz:**
- Credentials, API keys, passwords
- Sensitive personal info
- Anything where the answer is in the existing codebase

---

## Open questions punted to v0.5+

These are explicitly deferred. Don't try to solve them in v0.4:

- [ ] Public skill registry with semantic search
- [ ] Team/private registries (paid)
- [ ] GitHub Action that runs `crosskill build` on PR
- [ ] VS Code / Cursor extension
- [ ] `crosskill test` with Ollama integration
- [ ] Light theme
- [ ] Multi-window desktop support
- [ ] Skill diff viewer (compare two versions)
- [ ] Auto-detect which AI tools are installed in a folder
- [ ] Plugin system for custom compilers without core changes

---

## If you must deviate from this plan

It's a guide, not a contract. If you discover a better approach mid-build:

1. **Document the decision** in this file (`08_DECISIONS.md`) with a one-line rationale.
2. **Don't go silent** — leave a comment in the relevant phase doc noting the change.
3. **Don't break the contracts** in `01_ARCHITECTURE.md` (public API, hard rules, principles).
4. **Always preserve** the byte-for-byte CLI output contract from v0.1.0.

If a deviation would break a contract, stop and ask Aziz.
