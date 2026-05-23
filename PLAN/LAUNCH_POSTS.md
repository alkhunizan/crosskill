# Launch posts — ready to paste

Single source for every launch-day post, extracted from
[PLAN/05_PHASE4_LAUNCH.md](./05_PHASE4_LAUNCH.md). Edit in place before posting.

> **Pre-flight checklist:** GIF in place · README final · `crosskill.dev` live · v0.4.0 installers attached to the GitHub release · domain DNS green · five friends warned.

---

## Show HN

**Title:** `Show HN: Crosskill – Write AI coding-agent skills once, compile to every tool`

**Body:**

```
I got tired of copy-pasting the same skill into .claude/skills/, .cursor/rules/, AGENTS.md, .windsurf/, .aider/, .opencode/, and .gemini/.

Crosskill is a deterministic compiler: write one .skill.md file, compile to all 7+ AI coding tool formats. No LLMs in the build path. No API keys. No backend.

Three surfaces, one library:
- npx crosskill init (CLI)
- crosskill.dev (web playground — paste, preview, download zip)
- crosskill.app (Tauri desktop app with watch mode)

I started this after analyzing the top 500 GitHub trending repos in May 2026 — 89% were AI agents, but every one of them reinvented its own skill format. The meta-layer was empty. So I built it.

MIT licensed. No telemetry. No accounts. The web app works fully offline after first load.

GitHub: https://github.com/alkhunizan/crosskill
Demo: https://crosskill.dev

Happy to answer questions about the architecture, the cross-platform compiler approach, or why I picked Tauri 2 over Electron.
```

**Posting rules:**
- Tue or Wed, 19:00 Riyadh (= 08:00 PT).
- Reply within 5 min to every comment for the first 2 hours.
- Don't repost if it drops off page 1 in 30 min. Your launch is over for HN.

---

## Twitter / X — main thread (5 tweets)

**1 — hook + 20s demo GIF**
```
i was tired of writing the same AI coding skill 6 different ways

so i built crosskill — one .skill.md → .claude/, .cursor/, AGENTS.md, .windsurf/, .aider/, .opencode/, .gemini/

no install, no api keys, no backend

free, open source, runs entirely in your browser

🔗 crosskill.dev
[ATTACH 20s DEMO GIF]
```

**2 — the data**
```
the data: 89% of trending repos on github right now are AI agents

every one of them invented a different skill format

5% try to be cross-tool — the ones that do, trend hard

the meta-layer was empty. so i claimed it.
```

**3 — three surfaces**
```
three surfaces, one core:

🌐 web playground (try without install)
⌨ CLI: npx crosskill init
🖥 desktop app (watch mode, multi-workspace)

all share one pure-TS compiler. swap targets, swap surfaces, same outputs every time.
```

**4 — why no LLM in the build path**
```
why no LLM in the build path?

determinism. trust. cost. speed.

devs running `crosskill build` in CI won't tolerate a non-deterministic model rewriting their prompts. it's a compiler, not a brain.

the brain is your words. crosskill just makes sure every AI tool sees them.
```

**5 — links + CTA**
```
github: https://github.com/alkhunizan/crosskill
playground: https://crosskill.dev
desktop: https://crosskill.app

MIT, contributors welcome, especially new compiler targets (zed, cline, continue, copilot workspace).

would mean a lot if you ⭐ed the repo. and lemme know what targets to add next.
```

---

## Twitter / X — Najdi version

Post separately, target Arab dev audience.

```
كنت متضايق من إني أكتب نفس الـ AI skill بـ 6 طرق مختلفة

فسويت crosskill — تكتب skill واحد، يطلع لك في كل الأدوات مرة وحدة

كلود كود · كيرسر · كودكس · ويندسرف · أيدر · أوبن كود · جيميناي

بدون تنزيل، بدون مفاتيح، بدون باك إند

مجاني ومفتوح المصدر

crosskill.dev
```

---

## Reddit — r/LocalLLaMA

**Title:** `[Tool] Crosskill — compile one .skill.md file to every AI coding tool. 100% local, no API keys.`

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
- Copilot Workspace (.github/copilot-instructions.md)
- Continue.dev (.continue/)

No API calls. No telemetry. No accounts. The build path is pure TypeScript — no LLM in the loop. The web playground runs entirely in your browser. The desktop app (Tauri 2, ~6 MB installer) talks to your local filesystem only.

`crosskill test --eval` already pipes the skill's `examples:` block through your local Ollama for golden-output regression assertions. Add `OLLAMA_MODEL=qwen2.5:14b` to your env and you can lock in the prompt's behavior under CI.

GitHub: https://github.com/alkhunizan/crosskill
Demo (no install): https://crosskill.dev

Roast it.
```

---

## Reddit — r/ChatGPTCoding

**Title:** `Stopped maintaining 6 copies of every AI rule file. Made a compiler for them.`

```
If you use multiple AI coding tools (Claude Code, Cursor, Codex, Windsurf, Aider, etc.) you've felt this:

You write a good code-review rule. You paste it into .cursor/rules/. Then .claude/skills/. Then AGENTS.md. Then .windsurf/. Then .aider/. They drift. You fix one, you forget the others. Hell.

Crosskill: one .skill.md → all of them. Deterministic, free, MIT, no install needed to try.

https://crosskill.dev

Open to feedback on the format. Especially: which tool should I add next?
```

---

## Product Hunt

**Tagline:** `One skill, every AI coding tool.`

**Description (260 chars max):**
```
Tired of maintaining 6 versions of the same AI coding rule? Crosskill compiles one .skill.md to Claude Code, Cursor, Codex, Windsurf, Aider, OpenCode, Gemini, Copilot, Continue. Free, open source, runs in your browser. Desktop app for Win/Mac/Linux.
```

**Topics:** Developer Tools, GitHub, Productivity, AI

**Maker comment (post immediately after launch):**
```
Hey PH 👋

I'm Aziz. I built crosskill after realizing that 90% of GitHub trending right now is AI agents, but every single one invented its own skill format. So I'm copy-pasting the same prompt 6 times into 6 different folders. That's miserable.

Crosskill is a compiler. Write the prompt once, it generates the native format for each tool. No LLM in the build path — it's deterministic and runs entirely client-side on the web playground. Desktop version has a watch mode that auto-rewrites your tools the moment you save a skill.

MIT, no telemetry, no accounts. Three surfaces (CLI, web, desktop) sharing one core library.

I'm here all day to answer questions. Open to roasts.
```

---

## LinkedIn — long-form, EN

```
Last month I analyzed 500 trending GitHub repos and noticed something:

89% were AI agents.
27% were platform-locked skill packs ("Rules for Cursor", "Skills for Claude Code").
5% tried to be cross-tool. The ones that did, trended fast.

So I built the meta-layer.

Crosskill is a deterministic compiler. You write one *.skill.md file with YAML frontmatter, and it outputs the native skill/rules/instructions file for Claude Code, Cursor, Codex, Windsurf, Aider, OpenCode, Gemini CLI, Copilot Workspace, and Continue.dev.

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

---

## DM template (Tier 1 + Tier 2 outreach)

```
Hey [name],

Built a thing you might like: crosskill — write an AI coding-agent skill once, compile to every tool (Claude Code, Cursor, Codex, AGENTS.md, etc).

Free, open source, no install to try → https://crosskill.dev

No pitch. Just thought you'd find it useful given [their work on X].

Aziz
```

---

## Hard rules — do not violate

1. ❌ Don't ask for upvotes. HN bans accounts for this.
2. ❌ Don't post to HN + PH + Reddit at the same time. Stagger: HN first, PH next day, Reddit drip-feed.
3. ❌ Don't say "AI-powered" anywhere. The whole pitch is *no AI in the build path*.
4. ❌ Don't release with bugs you know about. Delay 24h instead.
5. ❌ Don't get into prolonged arguments. Reply once, fix if valid, move on.
6. ❌ Don't promise unbuilt features. Roadmap is fine, "coming soon" is fine, "we have X" when you don't is fatal.
