import { readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import kleur from "kleur";
import { parseSkillFile } from "../parser.js";
import { COMPILERS } from "../compilers/index.js";
import { findSkillFiles, loadConfig } from "../config.js";
import {
  SNAPSHOTS_DIR,
  checkSnapshot,
  compactLineDiff,
  listExistingSnapshots,
  type SnapshotResult,
} from "../snapshots.js";
import { createOllamaRunner } from "../runners/ollama.js";
import type { EvalRunner } from "../runners/runner.js";
import type { Skill, SkillExample, SupportedTarget } from "../schema.js";

interface TestOptions {
  cwd?: string;
  /** Rewrite snapshots from current compiler output instead of comparing. */
  updateSnapshots?: boolean;
  /** Run --eval mode in addition to snapshot mode. Requires a local LLM. */
  eval?: boolean;
  /** Override runner. For tests. */
  runner?: EvalRunner;
}

interface EvalResult {
  skill: string;
  exampleIndex: number;
  status: "pass" | "fail" | "skip";
  reason?: string;
}

function summarizeSnapshots(results: SnapshotResult[]): {
  matched: number;
  written: number;
  drifted: number;
  missing: number;
} {
  let matched = 0,
    written = 0,
    drifted = 0,
    missing = 0;
  for (const r of results) {
    if (r.status === "match") matched++;
    else if (r.status === "written") written++;
    else if (r.status === "drift") drifted++;
    else if (r.status === "missing") missing++;
  }
  return { matched, written, drifted, missing };
}

async function runEval(
  skill: Skill,
  runner: EvalRunner,
  systemPrompt: string
): Promise<EvalResult[]> {
  const examples: SkillExample[] = skill.frontmatter.examples ?? [];
  const out: EvalResult[] = [];
  for (let i = 0; i < examples.length; i++) {
    const ex = examples[i]!;
    let reply: string;
    try {
      reply = await runner.complete(systemPrompt, ex.input);
    } catch (err) {
      out.push({
        skill: skill.frontmatter.name,
        exampleIndex: i,
        status: "fail",
        reason: `runner error: ${(err as Error).message}`,
      });
      continue;
    }
    const failures: string[] = [];
    if (ex.contains) {
      for (const needle of ex.contains) {
        if (!reply.toLowerCase().includes(needle.toLowerCase())) {
          failures.push(`expected substring "${needle}"`);
        }
      }
    }
    if (ex.matches) {
      try {
        if (!new RegExp(ex.matches, "i").test(reply)) {
          failures.push(`expected regex match /${ex.matches}/i`);
        }
      } catch {
        failures.push(`invalid regex: ${ex.matches}`);
      }
    }
    out.push({
      skill: skill.frontmatter.name,
      exampleIndex: i,
      status: failures.length === 0 ? "pass" : "fail",
      reason: failures.length > 0 ? failures.join("; ") : undefined,
    });
  }
  return out;
}

/**
 * `crosskill test` — snapshot every compiled output and assert no drift.
 * With `--eval`, also runs each skill's `examples:` through a local LLM
 * (Ollama by default) and asserts `contains` / `matches`.
 */
export async function testCommand(opts: TestOptions = {}): Promise<void> {
  const cwd = opts.cwd ?? process.cwd();
  const config = loadConfig(cwd);
  const skillsDir = join(cwd, config.skillsDir);

  const files = findSkillFiles(skillsDir);
  if (files.length === 0) {
    console.log(
      kleur.yellow(
        `No skills found in ${config.skillsDir}. Run ${kleur.cyan("crosskill init")} first.`
      )
    );
    return;
  }

  const skills: Skill[] = [];
  for (const file of files) {
    try {
      skills.push(parseSkillFile(file));
    } catch (err) {
      console.error(kleur.red("✗ Failed to parse"), file);
      console.error(kleur.dim(String(err)));
      process.exitCode = 1;
    }
  }

  // Snapshot mode (always runs)
  const results: SnapshotResult[] = [];
  const expectedKeys = new Set<string>(); // skill::target

  for (const skill of skills) {
    const enabled = skill.frontmatter.targets ?? {};
    for (const target of Object.keys(enabled) as SupportedTarget[]) {
      if (!enabled[target]) continue;
      const compiler = COMPILERS[target];
      if (!compiler) continue;
      const compiled = compiler.compile(skill, cwd);
      const result = checkSnapshot(
        skillsDir,
        { skill: skill.frontmatter.name, target },
        compiled.content,
        opts.updateSnapshots === true
      );
      results.push(result);
      expectedKeys.add(`${skill.frontmatter.name}::${target}`);
    }
  }

  // Detect orphan snapshots: on disk but no longer matched by any skill
  const orphans = listExistingSnapshots(skillsDir).filter(
    (k) => !expectedKeys.has(`${k.skill}::${k.target}`)
  );

  if (opts.updateSnapshots && orphans.length > 0) {
    for (const o of orphans) {
      const p = join(skillsDir, SNAPSHOTS_DIR, o.skill, `${o.target}.txt`);
      rmSync(p, { force: true });
      console.log(kleur.dim(`  removed orphan snapshot ${o.skill}/${o.target}.txt`));
    }
    // Try to remove now-empty skill dirs; leave alone if other targets still live there
    const orphanSkills = new Set(orphans.map((o) => o.skill));
    for (const skillName of orphanSkills) {
      const dir = join(skillsDir, SNAPSHOTS_DIR, skillName);
      try {
        if (readdirSync(dir).length === 0) {
          rmSync(dir, { recursive: true, force: true });
        }
      } catch {
        // race or platform quirk — best-effort cleanup, ignore
      }
    }
  }

  for (const r of results) {
    const tag =
      r.status === "match"
        ? kleur.green("✓ match  ")
        : r.status === "written"
        ? kleur.cyan("✎ written")
        : r.status === "missing"
        ? kleur.yellow("? missing")
        : kleur.red("✗ drift  ");
    console.log(`${tag} ${r.key.skill} / ${r.key.target}`);
    if (r.status === "drift" && r.expected !== undefined && r.actual !== undefined) {
      console.log(kleur.dim(compactLineDiff(r.expected, r.actual)));
    }
  }
  for (const o of orphans) {
    if (!opts.updateSnapshots) {
      console.log(
        kleur.yellow("? orphan "),
        `${o.skill} / ${o.target}`,
        kleur.dim("(no skill targets this; rerun with --update-snapshots to delete)")
      );
    }
  }

  const summary = summarizeSnapshots(results);
  console.log();
  console.log(
    kleur.bold("Snapshots:"),
    kleur.green(`${summary.matched} matched`),
    summary.written > 0 ? kleur.cyan(`${summary.written} written`) : kleur.dim("0 written"),
    summary.drifted > 0 ? kleur.red(`${summary.drifted} drifted`) : kleur.dim("0 drifted"),
    summary.missing > 0 ? kleur.yellow(`${summary.missing} missing`) : kleur.dim("0 missing")
  );

  let failed = summary.drifted > 0 || summary.missing > 0;
  if (!opts.updateSnapshots && orphans.length > 0) failed = true;

  // Eval mode (opt-in)
  if (opts.eval) {
    console.log();
    console.log(kleur.bold("Eval:"));
    const runner = opts.runner ?? createOllamaRunner();
    const ping = await runner.ping();
    if (!ping.ok) {
      console.log(
        kleur.yellow("⊘ skipped"),
        kleur.dim(`(${runner.name} unreachable: ${ping.reason})`)
      );
    } else {
      console.log(kleur.dim(`  using ${runner.name}`));
      const claudeCompiler = COMPILERS.claude!;
      let passed = 0,
        failedEval = 0;
      for (const skill of skills) {
        const examples = skill.frontmatter.examples ?? [];
        if (examples.length === 0) continue;
        const compiled = claudeCompiler.compile(skill, cwd);
        // Strip front-matter so the system prompt is just the body.
        const systemPrompt = compiled.content.replace(/^---[\s\S]*?---\n?/, "").trim();
        const evalResults = await runEval(skill, runner, systemPrompt);
        for (const r of evalResults) {
          if (r.status === "pass") {
            passed++;
            console.log(kleur.green("✓ pass"), `${r.skill} #${r.exampleIndex}`);
          } else {
            failedEval++;
            console.log(
              kleur.red("✗ fail"),
              `${r.skill} #${r.exampleIndex}`,
              kleur.dim(`— ${r.reason}`)
            );
          }
        }
      }
      console.log();
      console.log(
        kleur.bold("Eval:"),
        kleur.green(`${passed} pass`),
        failedEval > 0 ? kleur.red(`${failedEval} fail`) : kleur.dim("0 fail")
      );
      if (failedEval > 0) failed = true;
    }
  }

  if (failed) {
    process.exitCode = 1;
  }
}
