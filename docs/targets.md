# Supported targets

Each compiler turns one `*.skill.md` into the native format of the target tool. Outputs are deterministic and idempotent.

## Claude Code

- **Output:** `.claude/skills/<name>/SKILL.md`
- **Format:** Markdown with front-matter (`name`, `description`, `version`, `license`, `author`).
- **Notes:** Claude Code reads `.claude/skills/*/SKILL.md` per project.

## Cursor

- **Output:** `.cursor/rules/<name>.mdc`
- **Format:** `.mdc` (Markdown with description front-matter, `alwaysApply: false`).
- **Notes:** Rules are surfaced to the model when relevant. Tune `alwaysApply` per project.

## Codex / OpenAI / AGENTS.md

- **Output:** `AGENTS.md` (single file at repo root)
- **Format:** Markdown sections, one `## <name>` heading per skill.
- **Notes:** Multiple skills are concatenated into one file with `---` between them.

## Windsurf

- **Output:** `.windsurf/rules/<name>.md`
- **Format:** Markdown.

## Aider

- **Output:** `.aider/skills/<name>.md`
- **Format:** Markdown. Wire into Aider via `--read` or `.aider.conf.yml`:
  ```yaml
  read:
    - .aider/skills/code-reviewer.md
  ```

## OpenCode

- **Output:** `.opencode/skills/<name>.md`
- **Format:** Markdown with front-matter (`name`, `description`).

## Gemini CLI

- **Output:** `.gemini/skills/<name>.md`
- **Format:** Markdown.

## Requesting a new target

If your favorite tool isn't here, [open an issue](https://github.com/azizme-com/crosskill/issues/new). A new compiler is usually under 30 lines — see [CONTRIBUTING.md](../CONTRIBUTING.md) for the recipe.
