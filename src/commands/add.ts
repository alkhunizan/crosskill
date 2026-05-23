import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import kleur from "kleur";
import { parseSkillString } from "../parser.js";
import { sha256 } from "../lockfile.js";
import { localResolver } from "../resolvers/local.js";
import { createGithubResolver } from "../resolvers/github.js";
import { parseRef, type SkillResolver, type ResolvedSkill } from "../resolvers/resolver.js";

export interface AddOptions {
  cwd?: string;
  /** Print what would be written without touching disk. */
  dryRun?: boolean;
  /** Required SHA-256 of the resolved content. Fails fast on mismatch. */
  sha?: string;
  /** Resolver override (used in tests to inject a mock fetch). */
  resolvers?: SkillResolver[];
}

const PREVIEW_LINES = 20;

/**
 * Default resolver chain. Order matters — first `canResolve` wins. The
 * registry-style `@scope/name` form is handled separately because there's
 * no resolver yet — we want a specific "not implemented" message rather
 * than a generic miss.
 */
function defaultResolvers(): SkillResolver[] {
  return [localResolver, createGithubResolver()];
}

async function resolve(ref: string, resolvers: SkillResolver[]): Promise<ResolvedSkill> {
  const parsed = parseRef(ref);
  if (!parsed) {
    throw new Error(
      `Unrecognised skill reference: "${ref}".\n` +
        `Accepted forms:\n` +
        `  - <name>                  (bundled starter, e.g. code-reviewer)\n` +
        `  - <user>/<repo>           (GitHub repo containing skill.md)\n` +
        `  - <user>/<repo>@<ref>     (pinned commit / tag / branch)\n` +
        `  - <user>/<repo>/<path>    (specific file inside the repo)`
    );
  }
  if (parsed.kind === "registry") {
    throw new Error(
      `Registry references (@${parsed.scope}/${parsed.name}) are reserved for the upcoming ` +
        `crosskill.dev registry. Use the GitHub form for now: <user>/<repo>.`
    );
  }
  for (const r of resolvers) {
    if (r.canResolve(ref)) return r.resolve(ref);
  }
  throw new Error(`No resolver matched reference: ${ref}`);
}

/**
 * `crosskill add <ref>` — fetch a skill from a built-in starter or a GitHub
 * repo, validate its front-matter, and write it to `./crosskill/<name>.skill.md`.
 *
 * Use `--sha <hex>` to pin to a known hash (printed on every successful
 * resolution so users can lock in after the first fetch). Use `--dry-run`
 * to preview without writing.
 */
export async function addCommand(skillRef: string, opts: AddOptions = {}): Promise<void> {
  const cwd = opts.cwd ?? process.cwd();
  const skillsDirInUserRepo = join(cwd, "crosskill");

  if (!existsSync(join(cwd, "crosskill.config.json"))) {
    console.log(
      kleur.red("crosskill not initialized."),
      `Run ${kleur.cyan("crosskill init")} first.`
    );
    process.exitCode = 1;
    return;
  }

  let resolved: ResolvedSkill;
  try {
    resolved = await resolve(skillRef, opts.resolvers ?? defaultResolvers());
  } catch (err) {
    console.error(kleur.red("✗"), (err as Error).message);
    process.exitCode = 1;
    return;
  }

  const hash = sha256(resolved.content);

  if (opts.sha && opts.sha.toLowerCase() !== hash.toLowerCase()) {
    console.error(
      kleur.red("✗ SHA-256 mismatch."),
      `\n  expected: ${opts.sha}\n  actual:   ${hash}`
    );
    process.exitCode = 1;
    return;
  }

  // Validate the front-matter before committing the file.
  let parsedSkill;
  try {
    parsedSkill = parseSkillString(resolved.content);
  } catch (err) {
    console.error(
      kleur.red("✗ Resolved content is not a valid skill."),
      `\n  source: ${resolved.source}\n  ${String(err)}`
    );
    process.exitCode = 1;
    return;
  }

  const skillName = parsedSkill.frontmatter.name;
  const dest = join(skillsDirInUserRepo, `${skillName}.skill.md`);

  console.log(kleur.dim("source:"), resolved.source);
  console.log(kleur.dim("sha256:"), hash);

  if (opts.dryRun) {
    console.log(kleur.dim("would write to:"), dest);
    console.log(kleur.dim(`preview (first ${PREVIEW_LINES} lines):`));
    const preview = resolved.content
      .split("\n")
      .slice(0, PREVIEW_LINES)
      .map((l) => `  ${l}`)
      .join("\n");
    console.log(preview);
    return;
  }

  if (existsSync(dest)) {
    console.log(kleur.yellow(`Skill "${skillName}" already exists at ${dest}. Skipping.`));
    return;
  }

  mkdirSync(skillsDirInUserRepo, { recursive: true });
  writeFileSync(dest, resolved.content, "utf8");

  console.log(kleur.green().bold(`✓ Added skill: ${skillName}`));
  console.log(`  ${kleur.dim("→")} ${dest.replace(cwd + "\\", "").replace(cwd + "/", "")}`);
  console.log(
    `  ${kleur.dim("Pin this version with")} ${kleur.cyan(`crosskill add ${skillRef} --sha ${hash}`)}`
  );
  console.log(`  Run ${kleur.cyan("crosskill build")} to compile it to every target.`);
}
