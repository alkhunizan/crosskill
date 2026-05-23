# crosskill — Master Build Plan for Claude Code

**Project:** crosskill — cross-platform compiler for AI coding-agent skills
**Goal:** Ship 3 surfaces (CLI · Web · Desktop) sharing one core library, all open-source, all free.
**Owner:** Aziz Al-Khunizan (@azizme_com)
**Status:** Phase 0 ✅ Complete · Phases 1–4 to execute
**Repo:** https://github.com/alkhunizan/crosskill
**Local:** `C:\Users\alkhu\Projects\crosskill`

---

## TL;DR for Claude Code

You are taking over a working open-source project. The CLI (v0.1.0) already works end-to-end with 15 passing tests. Your job is to:

1. **Refactor** the existing single-package repo into a **monorepo** with `packages/core` + `packages/cli`.
2. **Build a web playground** at `apps/web/` using Next.js 14 + Monaco + JSZip. Deploy to `crosskill.dev` on Netlify.
3. **Build a desktop app** at `apps/desktop/` using **Tauri 2**. Reuses the web app's UI. Ship installers for Win/macOS/Linux via GitHub Releases.
4. **Polish for launch** — demo GIFs, README updates, launch posts.

**Read these in order before doing anything:**
- `PLAN/00_CONTEXT.md` — what's already built, full project history
- `PLAN/01_ARCHITECTURE.md` — the three surfaces, the data flow, the diagram
- `PLAN/02_PHASE1_MONOREPO.md` — refactor steps
- `PLAN/03_PHASE2_WEB.md` — web playground build
- `PLAN/04_PHASE3_DESKTOP.md` — Tauri desktop app
- `PLAN/05_PHASE4_LAUNCH.md` — launch checklist
- `PLAN/06_DESIGN_SYSTEM.md` — UI guidance (theme, layout, copy tone)
- `PLAN/07_OPERATIONS.md` — CI, releases, signing, distribution
- `PLAN/08_DECISIONS.md` — open questions & defaults

**Hard rules (do not violate):**

1. **The core library MUST stay pure TypeScript** — no Node-only APIs (`fs`, `path`, `process`) inside `packages/core/src/`. Use a `FileWriter` interface; CLI implements with `fs`, web returns an in-memory map, desktop uses Tauri APIs.
2. **No LLM calls in the build path.** crosskill is a deterministic compiler. AI features (if any) live in opt-in commands only.
3. **All output must be reproducible.** Same input → same output bytes. No timestamps in files. No random IDs.
4. **No new external services.** Everything runs locally or as a static site. The web app has no backend.
5. **Keep the existing CLI behavior bit-for-bit identical.** Users running `npx crosskill build` after the refactor must get the exact same output as before.
6. **The web app must work fully offline** (after first load) — every compile happens in the browser.
7. **Match the existing code style.** Prettier defaults, strict TS, kebab-case file names, no default exports for non-React modules.
8. **All commits use Conventional Commits** (`feat:`, `fix:`, `refactor:`, etc.).
9. **Run the existing 15 tests after every phase.** If any break, stop and fix before moving on.
10. **Update the README every phase** so it reflects current capabilities.

---

## Execution order

```
Phase 1: Monorepo refactor       (≈ 2 hours)  →  packages/core + packages/cli, tests green
Phase 2: Web playground          (≈ 3 hours)  →  crosskill.dev live on Netlify
Phase 3: Desktop app (Tauri 2)   (≈ 4 hours)  →  Win/macOS/Linux installers via GH Releases
Phase 4: Launch polish           (≈ 2 hours)  →  GIFs, README, social posts, ProductHunt
```

Each phase produces a shippable artifact. Commit + push at the end of each phase. Tag releases at the end of Phase 2 (`v0.2.0`) and Phase 3 (`v0.3.0`).

---

## Aziz's preferences (from his profile)

- **ADHD-friendly, direct, no-fluff.** Lead with the answer, then the bullets.
- **Autonomous execution.** Don't ask permission for reversible work. State assumptions, proceed.
- **Najdi Arabic** for any Arabic strings/content. Never Egyptian/Levantine.
- **Windows main machine.** Paths use `C:\Users\alkhu\…`. Has Bun, Node 20+, Git, gh CLI, Python 3.13, RTX 4070, Ollama, ffmpeg installed.
- **`hello@azizme.com`** is his contact email.
- **GitHub:** `alkhunizan`. Twitter: `@azizme_com`. Site: `azizme.com`.
- **Open source projects:** MIT license, free forever core, no upsell pop-ups.

---

## Success criteria

You're done when:

- [ ] Monorepo builds cleanly with `bun install && bun run build` from the root
- [ ] All 15 original tests still pass + new tests for any new code
- [ ] `npx crosskill init && npx crosskill build` produces identical output to before the refactor (byte-for-byte)
- [ ] `crosskill.dev` is live, loads in < 2 seconds, lets users paste a skill and download a ZIP without any account
- [ ] Desktop app installers exist on GitHub Releases for Windows (.msi), macOS (.dmg), Linux (.AppImage)
- [ ] Desktop app can: open a folder, edit a skill, save, auto-write compiled outputs to that folder
- [ ] README clearly shows all three surfaces with screenshots/GIFs
- [ ] CI passes on push to main on all three packages
- [ ] At least 5 polished starter skills shipped in `packages/skills/`
- [ ] Launch posts drafted in `PLAN/05_PHASE4_LAUNCH.md` ready to publish

---

## If you get stuck

- **Read the existing code first.** It's small and well-commented. Don't rewrite — extend.
- **Run the tests.** They tell you what the contract is.
- **Check `PLAN/08_DECISIONS.md`** — it has defaults for every ambiguous choice.
- **Skip ahead, don't block.** If Phase 3 hits a code-signing wall on macOS, ship unsigned with a "right-click → Open" note in the README and move on. Polish in a follow-up release.
- **Never ask Aziz for credentials.** API keys for ElevenLabs/etc. live in his env vars. For npm publish, just print the `npm publish` command — he'll run it himself.
- **Domains:** `crosskill.dev` and `crosskill.app` need purchase. If they're not set up yet, deploy to `crosskill.netlify.app` and leave a TODO note. Don't block on this.

---

## Communication style with Aziz

When you finish each phase:

1. **One-line summary** of what changed.
2. **Bulleted list** of files created/modified.
3. **Any decisions you made** with one line of justification.
4. **Next phase to run** with the exact command.
5. **Nothing else.** No essays.

If you need a yes/no from him, present 2–3 options with a clear default. Never leave him with an open-ended question.
