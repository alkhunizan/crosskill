#!/usr/bin/env node
import { Command } from "commander";
import kleur from "kleur";
import { initCommand } from "./commands/init.js";
import { buildCommand } from "./commands/build.js";
import { checkCommand } from "./commands/check.js";
import { lintCommand } from "./commands/lint.js";
import { addCommand } from "./commands/add.js";

const program = new Command();

program
  .name("crosskill")
  .description(
    "Write AI coding-agent skills once. Compile to Claude Code, Cursor, Codex, Windsurf, Aider, OpenCode, Gemini CLI."
  )
  .version("0.1.0");

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
  .command("add <skill>")
  .description("Add a built-in starter skill (e.g. code-reviewer)")
  .action(async (skill: string) => {
    await addCommand(skill);
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(kleur.red("crosskill failed:"), err?.message ?? err);
  process.exit(1);
});
