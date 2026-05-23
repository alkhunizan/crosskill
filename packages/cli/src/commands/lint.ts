import { join } from "node:path";
import kleur from "kleur";
import {
  parseSkillFile,
  lintSkill,
  DEFAULT_LINT_CONFIG,
  findSkillFiles,
  loadConfig,
  type LintConfig,
} from "@crosskill/core/node";

interface LintOptions {
  cwd?: string;
}

export async function lintCommand(opts: LintOptions = {}): Promise<void> {
  const cwd = opts.cwd ?? process.cwd();
  const config = loadConfig(cwd);
  const lintConfig: LintConfig = { ...DEFAULT_LINT_CONFIG, ...(config.lint ?? {}) };
  const files = findSkillFiles(join(cwd, config.skillsDir));

  if (files.length === 0) {
    console.log(kleur.yellow("No skills found."));
    return;
  }

  let errorCount = 0;
  let warningCount = 0;

  for (const file of files) {
    let skill;
    try {
      skill = parseSkillFile(file);
    } catch (err) {
      errorCount++;
      console.log(kleur.red(`✗ ${file}`));
      console.log(kleur.dim(`  ${String(err)}`));
      continue;
    }
    const issues = lintSkill(skill, lintConfig);
    if (issues.length === 0) {
      console.log(kleur.green(`✓ ${skill.frontmatter.name}`));
      continue;
    }
    console.log(kleur.yellow(`! ${skill.frontmatter.name}`));
    for (const issue of issues) {
      const tag =
        issue.level === "error"
          ? kleur.red("error")
          : issue.level === "warning"
          ? kleur.yellow("warn ")
          : kleur.cyan("info ");
      console.log(`  ${tag} ${kleur.dim(`[${issue.rule}]`)} ${issue.message}`);
      if (issue.level === "error") errorCount++;
      else if (issue.level === "warning") warningCount++;
    }
  }

  console.log();
  if (errorCount > 0) {
    console.log(kleur.red().bold(`${errorCount} error(s), ${warningCount} warning(s).`));
    process.exitCode = 1;
  } else if (warningCount > 0) {
    console.log(kleur.yellow().bold(`0 errors, ${warningCount} warning(s).`));
  } else {
    console.log(kleur.green().bold("All skills clean."));
  }
}
