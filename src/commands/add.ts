import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import kleur from "kleur";

/**
 * `crosskill add <name>` — copy a built-in starter skill into the user's
 * crosskill/ directory. Future: also support `add user/skill` from the
 * crosskill.dev registry.
 */
export async function addCommand(skillRef: string): Promise<void> {
  const cwd = process.cwd();
  const skillsDirInUserRepo = join(cwd, "crosskill");

  if (!existsSync(join(cwd, "crosskill.config.json"))) {
    console.log(
      kleur.red("crosskill not initialized."),
      `Run ${kleur.cyan("crosskill init")} first.`
    );
    process.exitCode = 1;
    return;
  }

  // For MVP: only support built-in starter skills shipped with this package.
  // Format accepted: "code-reviewer" or "@crosskill/code-reviewer"
  const name = skillRef.replace(/^@crosskill\//, "").trim();
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(name)) {
    console.log(kleur.red(`Invalid skill name: ${skillRef}`));
    process.exitCode = 1;
    return;
  }

  // Resolve path to the built-in skills bundled with this package
  // dist/commands/add.js → ../../skills/<name>/skill.md
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(here, "..", "..", "skills", name, "skill.md"),
    join(here, "..", "skills", name, "skill.md"),
    // dev mode (running from src/)
    join(here, "..", "..", "..", "skills", name, "skill.md"),
  ];
  const sourcePath = candidates.find(existsSync);

  if (!sourcePath) {
    console.log(kleur.red(`Skill not found: ${name}`));
    console.log(
      kleur.dim(`Looked in: \n  ${candidates.join("\n  ")}`)
    );
    process.exitCode = 1;
    return;
  }

  mkdirSync(skillsDirInUserRepo, { recursive: true });
  const dest = join(skillsDirInUserRepo, `${name}.skill.md`);
  if (existsSync(dest)) {
    console.log(kleur.yellow(`Skill ${name} already exists at ${dest}. Skipping.`));
    return;
  }

  const body = readFileSync(sourcePath, "utf8");
  writeFileSync(dest, body, "utf8");

  console.log(kleur.green().bold(`✓ Added skill: ${name}`));
  console.log(`  ${kleur.dim("→")} ${dest.replace(cwd + "\\", "").replace(cwd + "/", "")}`);
  console.log(`  Run ${kleur.cyan("crosskill build")} to compile it to every target.`);
}
