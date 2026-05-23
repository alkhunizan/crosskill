# Kickoff prompt for Claude Code

Paste this verbatim into Claude Code (the CLI) when you're ready to start. It tells Claude Code exactly what to do, where to find the plan, and how to behave.

---

## Copy-paste this into Claude Code

```
You are working on the crosskill project — a cross-platform compiler for AI coding-agent skills. The Phase 0 CLI is already built and working with 15 passing tests. Your job is to execute Phases 1 through 4 to ship the web playground and desktop app.

Repository: https://github.com/alkhunizan/crosskill
Local path: C:\Users\alkhu\Projects\crosskill

**Read these files in order before doing anything else:**

1. PLAN/README.md
2. PLAN/00_CONTEXT.md
3. PLAN/01_ARCHITECTURE.md
4. PLAN/02_PHASE1_MONOREPO.md
5. PLAN/03_PHASE2_WEB.md
6. PLAN/04_PHASE3_DESKTOP.md
7. PLAN/05_PHASE4_LAUNCH.md
8. PLAN/06_DESIGN_SYSTEM.md
9. PLAN/07_OPERATIONS.md
10. PLAN/08_DECISIONS.md

Then start with Phase 1 (PLAN/02_PHASE1_MONOREPO.md) and work through phases sequentially. At the end of each phase:

- Run the acceptance checklist for that phase
- Commit with Conventional Commits
- Tag the release (v0.2.0 after Phase 1, v0.3.0 after Phase 2, v0.4.0 after Phase 3)
- Give me a brief summary: what changed, files created/modified, decisions made, next command to run
- Then ask "Continue to Phase N+1?" and wait

**Hard rules (never violate):**

1. The library must stay pure TypeScript — no Node-only APIs in packages/core/src/index.ts
2. No LLM calls in the build path
3. CLI output must remain byte-for-byte identical to v0.1.0
4. No new external services, no backend, no telemetry
5. Strict TypeScript, no `any`
6. All 15 existing tests must keep passing after every change
7. Use Conventional Commits

**Decisions you can make autonomously:**

- Code style, naming, file organization
- Library choices (within the constraints in 08_DECISIONS.md)
- Wording in error messages and docs
- Visual polish details

**When you need my input:**

- Anything that costs money (give me a default + the link)
- Public commitments (launch dates, etc.)
- Credentials (just print the command; I'll run it)

**My preferences:**

- Direct, no-fluff, ADHD-friendly
- Lead with the answer, then bullets
- Autonomous execution by default
- I'm on Windows, paths use C:\Users\alkhu\
- For any Arabic content, use Najdi dialect

Begin now: open PLAN/README.md and start reading.
```

---

## After Claude Code finishes Phase 1

Run these checks locally to confirm:

```powershell
cd C:\Users\alkhu\Projects\crosskill
bun install
bun test
# Must show: 15 pass, 0 fail
bun run typecheck
bun run build
# Must produce dist/ in packages/core/ and packages/cli/

# Verify byte-identical CLI output:
$smoke = "C:\Users\alkhu\AppData\Local\Temp\crosskill-smoke2"
if (Test-Path $smoke) { Remove-Item -Recurse -Force $smoke }
New-Item -ItemType Directory -Path $smoke | Out-Null
cd $smoke
node C:\Users\alkhu\Projects\crosskill\packages\cli\dist\cli.js init
node C:\Users\alkhu\Projects\crosskill\packages\cli\dist\cli.js build
# Should produce: 7 output files for code-reviewer
```

If everything passes, tell Claude Code to continue with Phase 2.

---

## After Claude Code finishes Phase 2

The web playground should be running. Test locally:

```powershell
cd C:\Users\alkhu\Projects\crosskill\apps\web
bun run dev
# Open http://localhost:3000
```

Verify the checklist in `PLAN/03_PHASE2_WEB.md` step 11. Then push to deploy.

**Buying domains** (Aziz's decision):

- crosskill.dev — $9.99 — https://vercel.com/domains/search?q=crosskill.dev
- crosskill.app — $9.99 — https://vercel.com/domains/search?q=crosskill.app

Recommended: buy both at the same time, route both through Netlify DNS for simplicity.

---

## After Claude Code finishes Phase 3

You should have a working `crosskill.exe` on your desktop.

```powershell
cd C:\Users\alkhu\Projects\crosskill\apps\desktop
bun run tauri:dev
# A native window opens with the crosskill UI
```

After the tag push, watch CI:

```powershell
gh run watch
```

After ~10–15 minutes, the GitHub release should have 3 installer files attached.

---

## After Claude Code finishes Phase 4

Hand off to launch day. Aziz manually executes the schedule in `PLAN/05_PHASE4_LAUNCH.md`.

Pre-launch checklist (run through this the day before):

- [ ] Domains bought and DNS configured
- [ ] crosskill.dev resolves and loads in < 2s
- [ ] At least 10 starter skills shipped
- [ ] Demo GIFs created (use ScreenToGif on Windows, or ffmpeg)
- [ ] CHANGELOG.md current
- [ ] All social post templates filled in
- [ ] HN post body ready (don't post early)
- [ ] Product Hunt account ready
- [ ] Reddit accounts have enough karma to post in target subs
- [ ] Sleep early the night before

Launch day: follow the timeline in `PLAN/05_PHASE4_LAUNCH.md` minute by minute. Don't deviate.
