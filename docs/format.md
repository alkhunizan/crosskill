# Skill format spec

A crosskill skill is a single `*.skill.md` (or `skill.md` inside a folder) file with two parts:

1. **YAML front-matter** — structured metadata.
2. **Markdown body** — the prompt / instructions themselves.

## Front-matter fields

| Field | Required | Type | Notes |
|---|---|---|---|
| `name` | ✅ | `string` (kebab-case) | Unique identifier. Used as filename in every target. Must match `/^[a-z0-9][a-z0-9-]*[a-z0-9]$/`. |
| `version` | — | `string` (semver) | Defaults to `0.1.0`. |
| `description` | ✅ | `string` (8–240 chars) | One-line summary shown in every target. |
| `author` | — | `string` | Free-form. GitHub handle recommended. |
| `tags` | — | `string[]` | For registry search. |
| `license` | — | `string` (SPDX id) | Defaults to `MIT`. |
| `targets` | ✅ | `object` | At least one target must be `true`. See below. |
| `tools` | — | `string[]` | Tools the skill expects (`read_file`, `grep`, etc). Informational. |
| `inputs` | — | `string[]` | Named inputs the skill consumes. Informational. |
| `homepage` | — | `string` (URL) | Optional link. |

## Targets

Each key in `targets` is a target tool. Set to `true` to enable, omit or `false` to skip.

```yaml
targets:
  claude: true        # Claude Code → .claude/skills/<name>/SKILL.md
  cursor: true        # Cursor → .cursor/rules/<name>.mdc
  codex: true         # Codex / OpenAI → AGENTS.md (section)
  windsurf: true      # Windsurf → .windsurf/rules/<name>.md
  aider: true         # Aider → .aider/skills/<name>.md
  opencode: true      # OpenCode → .opencode/skills/<name>.md
  gemini: true        # Gemini CLI → .gemini/skills/<name>.md
```

## Body

The body is the prompt itself, written in Markdown. There are no special markers — anything below the front-matter delimiter (`---`) is the body.

Recommended structure:

```md
You are <role>.

<core instructions, in numbered list>

<output format / constraints>

## Examples

<one or two worked examples>
```

## Linter rules

`crosskill lint` checks for:

- **`min-body-length`** — too-short bodies (default min: 80 chars).
- **`max-body-length`** — too-long bodies (default max: 8000 chars).
- **`require-examples`** — body has no `## Examples` section.
- **`vague-language`** — vague verbs (`help`, `try`, `maybe`, etc.).
- **`no-targets`** — no targets enabled.
- **`short-description`** — front-matter description is very short.

Configure overrides in `crosskill.config.json`:

```json
{
  "lint": {
    "minBodyLength": 80,
    "maxBodyLength": 8000,
    "requireExamples": true
  }
}
```

## Versioning

Skill versions follow [semver](https://semver.org/). Bump:

- **major** — breaking change in expected output structure
- **minor** — added capability without breaking old usage
- **patch** — wording tweaks, clarity fixes
