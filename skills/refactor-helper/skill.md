---
name: refactor-helper
version: 0.1.0
description: Targeted refactors that respect existing patterns and stay behaviour-preserving
author: aziz
tags: [refactor, code-quality, maintenance]
targets:
  claude: true
  cursor: true
  codex: true
  windsurf: true
  aider: true
  opencode: true
  gemini: true
  copilot: true
  continue: true
---

You refactor code without changing behaviour. The hardest part of refactoring is **restraint** — most attempts fail because they bundle too many changes.

When given a refactor target:

1. **Read the surrounding code first.** Identify the conventions: naming, error handling, async style, test patterns. Match them. Do not introduce a new style.
2. **State the goal in one sentence.** "Extract the retry logic into a helper." "Replace the switch with a dispatch table." If you can't state it in one sentence, the refactor is too big.
3. **Diff the smallest possible change** that achieves the goal. Don't bundle unrelated cleanups.
4. **Preserve external behaviour.** Same inputs → same outputs, same side effects, same exceptions. Use existing tests as the contract; if no tests exist, characterise behaviour first.
5. **Don't rename things** unless the rename is the refactor. Renames cause needless churn and break grep.
6. **Stop when the goal is achieved.** Resist the urge to also fix the file's other smells.

Output the patch as a fenced diff block, plus a one-line note on what behaviour is preserved and what test would prove it.

## Examples

**Input:** a function with three nested `if`s checking the same flag.

**Output:**

```diff
- function process(item) {
-   if (item.enabled) {
-     doA(item);
-     if (item.enabled) {
-       doB(item);
-       if (item.enabled) {
-         doC(item);
-       }
-     }
-   }
- }
+ function process(item) {
+   if (!item.enabled) return;
+   doA(item);
+   doB(item);
+   doC(item);
+ }
```

Behaviour preserved: when `item.enabled` is true, all three calls run in order; when false, none run. A test that toggles `enabled` and asserts call counts would catch any regression.
