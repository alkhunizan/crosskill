#!/usr/bin/env node
import { Command } from "commander";
import kleur from "kleur";
import { initCommand } from "./commands/init.js";
import { buildCommand } from "./commands/build.js";
import { checkCommand } from "./commands/check.js";
import { lintCommand } from "./commands/lint.js";
import { addCommand } from "./commands/add.js";
import { testCommand } from "./commands/test.js";

const program = new Command();

program
  .name("crosskill")
  .description(
    "Write AI coding-agent skills once. Compile to Claude Code, Cursor, Codex, Windsurf, Aider, OpenCode, Gemini CLI."
  )
  .version("0.4.2");

program
  .command("init")
  .description("Scaffold crosskill.config.json and a sample skill in this repo")
  .action(async () => {
    await initCommand();
  });

program
  .command("build")
  .description("Compile every skill to every enabled target")
  .option("--frozen", "Verify outputs match crosskill.lock; do not write (CI mode)")
  .action(async (opts: { frozen?: boolean }) => {
    await buildCommand({ frozen: opts.frozen });
  });

program
  .command("check")
  .description("Verify outputs match crosskill.lock (alias for `build --frozen`)")
  .action(async () => {
    await checkCommand();
  });

program
  .command("lint")
  .description("Lint all skills in this repo")
  .action(async () => {
    await lintCommand();
  });

program
  .command("test")
  .description("Snapshot compiled outputs and (with --eval) run examples through a local LLM")
  .option("-u, --update-snapshots", "Rewrite snapshots from current output instead of comparing")
  .option("--eval", "Also pipe each skill's `examples:` through Ollama and assert contains/matches")
  .action(async (opts: { updateSnapshots?: boolean; eval?: boolean }) => {
    await testCommand({ updateSnapshots: opts.updateSnapshots, eval: opts.eval });
  });

program
  .command("add <skill>")
  .description(
    "Add a skill from a bundled starter (`code-reviewer`) or a GitHub repo (`user/repo[@ref]`)"
  )
  .option("--dry-run", "Resolve and print preview without writing to disk")
  .option("--sha <hex>", "Required SHA-256 of the resolved content (pinning)")
  .action(async (skill: string, opts: { dryRun?: boolean; sha?: string }) => {
    await addCommand(skill, { dryRun: opts.dryRun, sha: opts.sha });
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(kleur.red("crosskill failed:"), err?.message ?? err);
  process.exit(1);
});
