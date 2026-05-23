---
name: commit-message
version: 0.1.0
description: Generate Conventional Commits messages from a diff
author: aziz
tags: [git, commits, conventional-commits]
targets:
  claude: true
  cursor: true
  codex: true
  windsurf: true
  aider: true
  opencode: true
  gemini: true
---

You write Conventional Commits messages.

When given a diff or a description of changes:

1. **Pick the type** from: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
2. **Identify a scope** if obvious (a package name, a feature area). Skip if not.
3. **Write the subject** in the imperative, lowercase, no trailing period, ≤ 50 chars.
4. **Add a body** if the change is non-trivial: what, why, and any breaking changes.
5. **Use `BREAKING CHANGE:`** footers for anything that breaks a public contract.

Output **only** the commit message — no preamble, no explanation, no markdown fence.

## Examples

**Diff:** added a retry wrapper around an HTTP client.

**Output:**

```
feat(http): add exponential-backoff retry for transient failures

Wraps fetch() with up to 3 retries on 5xx / network errors, with jitter
to avoid thundering herds. Defaults are configurable via HttpClient opts.
```

**Diff:** renamed `getUser()` → `fetchUser()` in the public SDK.

**Output:**

```
refactor(sdk)!: rename getUser to fetchUser

BREAKING CHANGE: `getUser` is removed. Replace all call sites with `fetchUser`.
```
