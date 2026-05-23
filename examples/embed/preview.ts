// Tiny embedder demo: render a multi-target preview from an in-memory buffer.
// No filesystem, no network. This is the shape an editor extension would take.
//
// Run: `bun examples/embed/preview.ts` from the repo root.

import { compileSkillForPreview } from "crosskill";

const BUFFER = `---
name: hello-world
version: 0.1.0
description: A tiny demo skill to exercise the embed API end-to-end
targets:
  claude: true
  cursor: true
---
Say hello in 5 words or fewer.

## Examples
**In:** hi. **Out:** hello there.
`;

const preview = compileSkillForPreview(BUFFER, {
  onlyTargets: ["claude", "cursor"],
});

if (preview.parseError) {
  console.error("Parse failed:", preview.parseError.message);
  process.exit(1);
}

console.log(`Parsed skill: ${preview.skill!.frontmatter.name}`);
console.log(`Lint issues: ${preview.lintIssues.length}`);
for (const issue of preview.lintIssues) {
  console.log(`  [${issue.level}] ${issue.rule}: ${issue.message}`);
}
console.log();

for (const result of preview.compiled) {
  console.log(`=== ${result.target} → ${result.outputPath}`);
  console.log(result.content);
}
