# crosskill API reference

Public library API for embedding crosskill inside other tools — editor
extensions, live previews, web playgrounds, custom CLIs.

Everything here is exported from the package root:

```ts
import { compileSkillForPreview } from "crosskill";
```

The CLI (`crosskill build`, `crosskill lint`, etc.) is documented in the
[README](../README.md). This file covers the **library** surface only.

## Stability

Anything exported from `src/index.ts` is the public API and follows semver.
Internal helpers (`src/lockfile.ts`, `src/snapshots.ts`, `src/resolvers/*`,
`src/runners/*`, every file in `src/commands/`) are **not** re-exported and
may change without notice.

## Parsing

### `parseSkillString(source, sourcePath?)`

Parse a raw `*.skill.md` string into a `Skill` object. Throws
`SkillParseError` with a list of front-matter issues on bad input. An empty
body is also a hard error.

```ts
import { parseSkillString } from "crosskill";

const skill = parseSkillString(buffer);
console.log(skill.frontmatter.name);
console.log(skill.body);
```

### `parseSkillFile(filePath)`

Same as `parseSkillString` but reads from disk.

### `SkillParseError`

Class extends `Error`. `.source` holds the file path (or `"<inline>"`).

## Compilation

### `compileSkillForPreview(source, options?)`

**Recommended entry point for editor integrations.** One call returns parse
status, lint issues, and compiled outputs for every enabled target.

```ts
import { compileSkillForPreview } from "crosskill";

const preview = compileSkillForPreview(editor.getValue(), {
  onlyTargets: ["claude", "cursor"],
});

if (preview.parseError) {
  showInlineError(preview.parseError.message);
  return;
}
renderLintGutter(preview.lintIssues);
for (const result of preview.compiled) {
  tabs[result.target].setText(result.content);
}
```

#### `PreviewOptions`

| Field         | Type                  | Default                | Notes |
| ------------- | --------------------- | ---------------------- | --- |
| `lintConfig`  | `LintConfig`          | `DEFAULT_LINT_CONFIG`  | Override lint thresholds |
| `onlyTargets` | `SupportedTarget[]`   | every enabled target   | Restrict compilation to a subset (cheap when previewing one tab) |
| `outputRoot`  | `string`              | `"."`                  | Conceptual root for `CompileResult.outputPath` |

#### `PreviewResult`

| Field         | Type                          | Notes |
| ------------- | ----------------------------- | --- |
| `skill`       | `Skill \| undefined`          | Populated when parse succeeded |
| `parseError`  | `SkillParseError \| Error \| undefined` | Populated when parse failed |
| `lintIssues`  | `LintIssue[]`                 | Empty `[]` on parse failure |
| `compiled`    | `CompileResult[]`             | Empty `[]` on parse failure |

### `compileSkill(skillOrSource, target, outputRoot?)`

Compile a single target. Throws if the target name has no registered
compiler. Pure — no FS.

```ts
import { compileSkill } from "crosskill";

const result = compileSkill(buffer, "claude");
// { target: "claude", outputPath: ".claude/skills/<name>/SKILL.md", content: "..." }
```

### `compileSkillAll(skillOrSource, outputRoot?)`

Compile every target the skill enables. Returns one `CompileResult` per
target. Targets without a registered compiler are silently skipped. Pure —
no FS.

### `getCompiler(target)`

Return the `Compiler` impl for a target, or `undefined` if none is
registered.

### `COMPILERS`

The compiler registry as a `Record<SupportedTarget, Compiler | undefined>`.
Iterate it to enumerate available targets.

## Linting

### `lintSkill(skill, config?)`

Run lint rules against a parsed skill. Returns `LintIssue[]` — empty array
means clean. See [Linter rules](./format.md#linter-rules) for the rule list.

```ts
import { lintSkill } from "crosskill";

const issues = lintSkill(skill);
const errors = issues.filter((i) => i.level === "error");
```

### `DEFAULT_LINT_CONFIG`

The default `LintConfig` (min/max body length, require-examples). Override
fields piecemeal:

```ts
import { lintSkill, DEFAULT_LINT_CONFIG } from "crosskill";
const issues = lintSkill(skill, { ...DEFAULT_LINT_CONFIG, requireExamples: false });
```

### `LintIssue`

| Field     | Type                              | Notes |
| --------- | --------------------------------- | --- |
| `level`   | `"error" \| "warning" \| "info"`  | Severity |
| `message` | `string`                          | Human-readable explanation |
| `rule`    | `string`                          | Stable rule ID (e.g. `require-examples`) |

## Schema

### `SkillFrontmatterSchema`

The zod schema used for front-matter validation. Use this if you want to
validate front-matter in your own UI without parsing the whole file.

```ts
import { SkillFrontmatterSchema } from "crosskill";
const result = SkillFrontmatterSchema.safeParse({ name: "x", description: "..." });
```

### `SUPPORTED_TARGETS`

Tuple of every target name crosskill knows about. Includes placeholders for
targets without a registered compiler.

### Types

Exported types: `Skill`, `SkillFrontmatter`, `SkillExample`,
`SupportedTarget`, `Compiler`, `CompileResult`, `LintIssue`, `LintConfig`,
`PreviewResult`, `PreviewOptions`.

## Source maps

The published bundle ships with linked source maps (`dist/index.js.map`,
`dist/cli.js.map`). Stack traces in your debugger will resolve to the
original `.ts` files.

## End-to-end example

See [examples/embed/](../examples/embed/) for a 25-line working program that
imports from `crosskill` and renders a preview against an in-memory buffer
without touching the filesystem.
