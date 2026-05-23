# Basic example

Smallest possible crosskill setup — one skill, all targets.

```bash
cd examples/basic
npx crosskill init    # if you want a fresh config
npx crosskill build   # compiles hello-world.skill.md to every target
```

After `build`, you'll see new directories appear:

```
.claude/skills/hello-world/SKILL.md
.cursor/rules/hello-world.mdc
AGENTS.md
.windsurf/rules/hello-world.md
.aider/skills/hello-world.md
.opencode/skills/hello-world.md
.gemini/skills/hello-world.md
```

One skill. Seven outputs. Same words.

That's the whole point.
