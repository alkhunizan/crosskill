# 05 — Phase 4: Launch

**Goal:** Get crosskill to 1,000+ stars in 30 days. Run a coordinated multi-channel launch.

**Time estimate:** ~2 hours setup + 1 day execution
**Risk level:** Low (everything reversible)
**Deliverable:** Repo trending on GitHub, picked up by HN front page, listed on Product Hunt.

---

## Pre-launch checklist (all must be ✓ before you post anywhere)

### Repository polish
- [ ] README has a hero GIF (≤ 20s, ≤ 8 MB) showing init → build → 7 files appearing
- [ ] README has 3 sections clearly labeled: "Web · CLI · Desktop"
- [ ] All 3 surfaces work end-to-end
- [ ] At least 10 starter skills shipped (`code-reviewer`, `commit-message`, `pr-summarizer`, `arabic-najdi-writer`, `test-writer`, `refactor-helper`, `doc-writer`, `debug-buddy`, `readme-generator`, `api-designer`)
- [ ] CI badge in README points to a green build
- [ ] License + Contributing + Code of Conduct linked
- [ ] Issue templates: `bug_report.md`, `new_target.md`, `new_skill.md`, `feature_request.md`
- [ ] PR template
- [ ] CHANGELOG.md with v0.1.0 → v0.4.0 entries
- [ ] `crosskill.dev` live with custom domain + SSL
- [ ] Desktop releases on GitHub Releases with all 3 installers

### Visual assets
- [ ] Logo: 1024x1024 PNG + SVG
- [ ] Favicon (`crosskill.dev/favicon.svg`)
- [ ] OG image: 1200x630 (`crosskill.dev/og.png`)
- [ ] Hero GIF: 1280x720 max, ≤ 8 MB
- [ ] Screen recordings: web playground demo (15s), desktop watch-mode demo (20s)
- [ ] Social cards: 1200x628 for Twitter, 1080x1080 for LinkedIn/IG

### Distribution channels ready
- [ ] npm: `@crosskill/core`, `crosskill`, `@crosskill/skills` published
- [ ] GitHub Releases: v0.4.0 with desktop installers
- [ ] Netlify deploy hooked to `main` branch
- [ ] crosskill.app `/download` page resolves correctly

---

## Launch day timeline (single day execution)

All times below are 24h, Riyadh local (UTC+3). Adjust if launch is on a different timezone.

### T-24h (the day before)
- [ ] Final review of README, all GIFs, all copy
- [ ] Schedule social posts via Postiz (use Aziz's existing scheduler)
- [ ] Email 5 friends/peers: "Launching tomorrow at X PM PT, would love an honest upvote if you find it useful"
- [ ] Pre-write all launch posts (templates below)
- [ ] Sleep early

### T-0 = Tuesday or Wednesday, 19:00 Riyadh (= 8:00 PT)
- [ ] **Show HN post** (highest priority — see template below)
- [ ] **Twitter/X thread** (auto-scheduled via Postiz)
- [ ] **Reddit posts** (manually, 5 min apart, different angles):
  - r/LocalLLaMA — local-first angle
  - r/ChatGPTCoding — multi-tool angle
  - r/cursor — Cursor rules angle
  - r/programming — open-source dev tool angle
- [ ] **dev.to long-form post**
- [ ] **LinkedIn post** in EN + a separate Najdi post for Arab audience

### T+1h
- [ ] Reply to every HN comment within 5 min
- [ ] Reply to every Twitter reply within 10 min
- [ ] Pin a tweet with the demo GIF

### T+4h
- [ ] **Product Hunt** launch (PH days start at 00:01 PT, so go live for the next PH day, not same day as HN)
- [ ] Email anyone who's a known hunter

### T+12h
- [ ] Check trending: is crosskill on the GitHub trending page for TypeScript/Tools?
- [ ] If yes, screenshot it, post about it ("we hit the trending page in 12 hours, thank you").

### T+24h
- [ ] Write a "lessons learned" blog post (boost SEO + community love)
- [ ] Reach out to 5 maintainers of similar repos: "Hey, I built this, would love your feedback. Open to a PR adding [their tool] as a target?"

---

## Post templates

### Show HN

**Title:** `Show HN: Crosskill – Write AI coding-agent skills once, compile to every tool`

**Body:**

```
I got tired of copy-pasting the same skill into .claude/skills/, .cursor/rules/, AGENTS.md, .windsurf/, .aider/, .opencode/, and .gemini/.

Crosskill is a deterministic compiler: write one .skill.md file, compile to all 7 (and counting) AI coding tool formats. No LLMs in the build path. No API keys. No backend.

Three surfaces, one library:
- npx crosskill init   (CLI)
- crosskill.dev        (web playground — paste, preview, download zip)
- crosskill.app        (Tauri desktop app with watch mode)

I started this after analyzing the top 500 GitHub trending repos in May 2026 — 89% were AI agents, but every one of them reinvented its own skill format. The meta-layer was empty. So I built it.

MIT licensed. No telemetry. No accounts. The web app works fully offline after first load.

GitHub: https://github.com/alkhunizan/crosskill
Demo: https://crosskill.dev

Happy to answer any questions about the architecture, the cross-platform compiler approach, or why I picked Tauri 2 over Electron.
```

**Posting rules:**
- Post Tue or Wed, 19:00 Riyadh (08:00 PT)
- Don't ask for upvotes
- Reply to every comment within 5 minutes for the first 2 hours
- If a critique is fair, agree and fix it visibly
- If the post drops below the front page in 30 min, don't repost — your launch is over for HN

### Twitter / X thread (5 tweets)

**Tweet 1 (hook + GIF):**
```
i was tired of writing the same AI coding skill 6 different ways

so i built crosskill — one .skill.md → .claude/, .cursor/, AGENTS.md, .windsurf/, .aider/, .opencode/, .gemini/

no install, no api keys, no backend

free, open source, runs entirely in your browser

🔗 crosskill.dev
[ATTACH 20s DEMO GIF]
```

**Tweet 2:**
```
the data: 89% of trending repos on github right now are AI agents

every one of them invented a different skill format

5% try to be cross-tool — the ones that do, trend hard

the meta-layer was empty. so i claimed it.
```

**Tweet 3:**
```
three surfaces, one core:

🌐 web playground (try without install)
⌨ CLI: npx crosskill init
🖥 desktop app (watch mode, multi-workspace)

all share one pure-TS compiler. swap targets, swap surfaces, same outputs every time.
```

**Tweet 4:**
```
why no LLM in the build path?

determinism. trust. cost. speed.

devs running `crosskill build` in CI won't tolerate a non-deterministic model rewriting their prompts. it's a compiler, not a brain.

the brain is your words. crosskill just makes sure every AI tool sees them.
```

**Tweet 5:**
```
github: https://github.com/alkhunizan/crosskill
playground: https://crosskill.dev
desktop: https://crosskill.app

MIT, contributors welcome, especially new compiler targets (zed, cline, continue, copilot workspace).

would mean a lot if you ⭐ed the repo. and lemme know what targets to add next.
```

### Twitter thread — Najdi version

```
كنت متضايق من إني أكتب نفس الـ AI skill بـ 6 طرق مختلفة

فسويت crosskill — تكتب skill واحد، يطلع لك في كل الأدوات مرة وحدة

كلود كود · كيرسر · كودكس · ويندسرف · أيدر · أوبن كود · جيميناي

بدون تنزيل، بدون مفاتيح، بدون باك إند

مجاني ومفتوح المصدر

crosskill.dev
```

### Reddit post — r/LocalLLaMA

**Title:** `[Tool] Crosskill — compile one .skill.md file to every AI coding tool. 100% local, no API keys.`

**Body:**

```
Posting here because the local-first angle matters to you.

Crosskill is a deterministic TypeScript compiler. You write one .skill.md file with YAML frontmatter, and it generates the native skill/rules/instructions files for:

- Claude Code (.claude/skills/)
- Cursor (.cursor/rules/)
- Codex / OpenAI (AGENTS.md)
- Windsurf (.windsurf/rules/)
- Aider (.aider/skills/)
- OpenCode (.opencode/skills/)
- Gemini CLI (.gemini/skills/)

No API calls. No telemetry. No accounts. The build path is pure TypeScript — no LLM in the loop. The web playground runs entirely in your browser. The desktop app (Tauri 2, ~6 MB installer) talks to your local filesystem only.

I've been running it against Ollama + Qwen2.5:14B locally as part of my own daily coding stack. Planning to add `crosskill test` in v0.5 that runs your skills against your local model with golden-output assertions, so you can regression-test prompts in CI.

GitHub: https://github.com/alkhunizan/crosskill
Demo (no install): https://crosskill.dev

Roast it.
```

### Reddit post — r/ChatGPTCoding

**Title:** `Stopped maintaining 6 copies of every AI rule file. Made a compiler for them.`

**Body:**

```
If you use multiple AI coding tools (Claude Code, Cursor, Codex, Windsurf, Aider, etc.) you've felt this:

You write a good code-review rule. You paste it into .cursor/rules/. Then .claude/skills/. Then AGENTS.md. Then .windsurf/. Then .aider/. They drift. You fix one, you forget the others. Hell.

Crosskill: one .skill.md → all of them. Deterministic, free, MIT, no install needed to try.

https://crosskill.dev

Open to feedback on the format. Especially: which tool should I add next?
```

### Product Hunt

**Tagline:** `One skill, every AI coding tool.`

**Description (260 chars max):**
```
Tired of maintaining 6 versions of the same AI coding rule? Crosskill compiles one .skill.md to Claude Code, Cursor, Codex, Windsurf, Aider, OpenCode, and Gemini CLI. Free, open source, runs in your browser. Desktop app for Win/Mac/Linux.
```

**Topics:** Developer Tools, GitHub, Productivity, AI

**Maker comment** (post immediately after launch):
```
Hey PH 👋

I'm Aziz. I built crosskill after realizing that 90% of GitHub trending right now is AI agents, but every single one invented its own skill format. So I'm copy-pasting the same prompt 6 times into 6 different folders. That's miserable.

Crosskill is a compiler. Write the prompt once, it generates the native format for each tool. No LLM in the build path — it's deterministic and runs entirely client-side on the web playground. Desktop version has a watch mode that auto-rewrites your tools the moment you save a skill.

MIT, no telemetry, no accounts. Three surfaces (CLI, web, desktop) sharing one core library.

I'm here all day to answer questions. Open to roasts.
```

### LinkedIn post (long-form, EN)

```
Last month I analyzed 500 trending GitHub repos and noticed something:

89% were AI agents.
27% were platform-locked skill packs ("Rules for Cursor", "Skills for Claude Code").
5% tried to be cross-tool. The ones that did, trended fast.

So I built the meta-layer.

Crosskill is a deterministic compiler. You write one *.skill.md file with YAML frontmatter, and it outputs the native skill/rules/instructions file for Claude Code, Cursor, Codex, Windsurf, Aider, OpenCode, and Gemini CLI.

Three surfaces, one library:
→ npx crosskill init (CLI for developers + CI)
→ crosskill.dev (web playground, runs in your browser)
→ crosskill.app (Tauri 2 desktop app, ~6 MB installer)

What I'm proud of:
- No LLM in the build path (determinism, trust, speed)
- Zero backend
- Zero telemetry
- MIT licensed, free forever
- Works fully offline

What I learned:
- The meta-layer is always the most valuable layer to claim early
- Three surfaces aren't 3x the work if you architect right — they're 1.3x
- Cross-platform skill compilers are basically "npm for AI agents" and that's a real position

Try it: https://crosskill.dev
Star it: https://github.com/alkhunizan/crosskill

What's the next tool I should support? Drop a comment.

#opensource #ai #devtools
```

### dev.to article (≈ 1,200 words)

Title: **"I analyzed 500 trending repos and found the gap. Here's the tool that fills it."**

Outline:
1. The 500-repo analysis (data, charts)
2. The pattern: AI agent monoculture + skill-format chaos
3. The opportunity: meta-layer claim
4. The build: 3 surfaces, 1 core
5. Tech choices: Tauri 2 over Electron, static Next.js, no backend
6. Open call: contribute a target, contribute a skill

Embed the demo GIF. Link to the GitHub repo and crosskill.dev. End with a contribution CTA.

---

## Outreach list (DM/email these people T+0 to T+72h)

Tier 1 — high-signal AI-tool builders:
- [ ] Maintainers of `graphify` (the 52k ⭐ cross-tool repo that validated the demand)
- [ ] Maintainers of `agentic-stack`, `skills-manage`, `agent-rules-books`
- [ ] @swyx (newsletters often cover this kind of thing)
- [ ] @simonw (DevTools / LLM crossover)
- [ ] @shawnswyx (latent space)
- [ ] @geoffreylitt (local-first dev tools community)
- [ ] @adamwathan (Tailwind / dev-tool launch playbook)

Tier 2 — newsletter authors:
- [ ] TLDR Newsletter (tldr.tech)
- [ ] Console Newsletter (console.dev)
- [ ] Bytes (bytes.dev)
- [ ] JavaScript Weekly
- [ ] Hacker Newsletter (HN curators)
- [ ] AI Engineer Newsletter

Tier 3 — Arabic dev community (Aziz's edge):
- [ ] Saudi dev Twitter/Discord communities
- [ ] @arabthrash, @nasr, other Saudi YouTubers in tech
- [ ] Mostaql / Bahr posters who do localization

DM template:

```
Hey [name],

Built a thing you might like: crosskill — write an AI coding-agent skill once, compile to every tool (Claude Code, Cursor, Codex, AGENTS.md, etc).

Free, open source, no install to try → https://crosskill.dev

No pitch. Just thought you'd find it useful given [their work on X].

Aziz
```

---

## Anti-patterns (do NOT do these)

1. ❌ Don't ask for upvotes. HN bans accounts for this.
2. ❌ Don't post on HN + PH + Reddit simultaneously. Stagger them — HN first, PH next day, Reddit drip-feed.
3. ❌ Don't add "AI-powered" to the description. The selling point is *no AI in the build path*.
4. ❌ Don't release with bugs you know about. Better to delay 24h than launch buggy.
5. ❌ Don't gatekeep the project. Accept PRs for new targets/skills aggressively in the first week.
6. ❌ Don't get into prolonged arguments in comments. Reply once, fix if valid, move on.
7. ❌ Don't promise features you haven't built. Roadmap section is fine; "coming soon" is fine; "we have X" when you don't is fatal.

---

## Success metrics (track for 30 days)

| Metric | Day 1 target | Week 1 target | Month 1 target |
|---|---|---|---|
| GitHub stars | 100 | 750 | 2,500 |
| crosskill.dev visits | 2,000 | 8,000 | 30,000 |
| ZIP downloads (web) | 200 | 1,200 | 5,000 |
| npm weekly downloads | 100 | 600 | 3,000 |
| Desktop installer downloads | 50 | 300 | 1,500 |
| New compiler targets contributed | 0 | 1 | 3 |
| New starter skills contributed | 0 | 3 | 10 |
| HN points (if posted) | 50+ | n/a | n/a |
| Product Hunt rank on launch day | n/a | top 10 | n/a |

Track via:
- GitHub repo insights (stars/clones/views over time)
- Netlify analytics (visits, top pages)
- npm download stats (npmjs.com/package/crosskill)
- GitHub release download counts (per-asset)

If at T+72h we're under 100 ⭐, post a "lessons learned + what would you want to see" follow-up. Don't quit. Most projects need 2-3 mini-relaunches to find traction.

---

## What's next (post-launch)

In priority order for the next 30 days:

1. **v0.5 — `crosskill test`** against local Ollama. Golden-output assertions per skill. Most-requested feature, validates the "real infrastructure" position.
2. **2 more compiler targets** based on community asks (likely: Zed Assistant, Cline, Continue.dev).
3. **5 more starter skills** based on community asks.
4. **Public skill registry** at crosskill.dev/skills — searchable, with semantic ranking. Stays static (no auth, just a JSON index).
5. **GitHub Action** that runs `crosskill build && crosskill lint` on every PR.
6. **VS Code / Cursor extension** with live multi-target preview.

If traction hits the month-1 targets above, that's product-market fit signal — start thinking about an optional paid tier for private team registries (kept far from the open-source core).
