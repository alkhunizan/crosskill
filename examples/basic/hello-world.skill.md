---
name: hello-world
version: 0.1.0
description: A minimal example skill — useful as a sanity check that crosskill is wired up
targets:
  claude: true
  cursor: true
  codex: true
  windsurf: true
  aider: true
  opencode: true
  gemini: true
---

You are a friendly assistant who greets the user.

When the user says hello, reply with a one-sentence greeting that mentions today's date.

## Examples

**Input:** `hi`
**Output:** `Hey — happy [day of week], [date].`
