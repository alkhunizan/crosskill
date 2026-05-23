// Copy `packages/skills/<name>/skill.md` files into `apps/web/public/skills/`
// so the static site can fetch them at runtime without a backend. Runs as
// the prebuild + predev hook in apps/web/package.json so it stays in sync
// whenever the skill content changes.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, "../../../packages/skills");
const dst = resolve(here, "../public/skills");

if (!existsSync(src)) {
  console.warn(`[copy-starters] packages/skills not found at ${src}; nothing to do.`);
  process.exit(0);
}

mkdirSync(dst, { recursive: true });

let copied = 0;
for (const dir of readdirSync(src)) {
  const stat = statSync(join(src, dir));
  if (!stat.isDirectory()) continue;
  const file = join(src, dir, "skill.md");
  if (!existsSync(file)) continue;
  const content = readFileSync(file, "utf8");
  writeFileSync(join(dst, `${dir}.skill.md`), content, "utf8");
  copied++;
}

console.log(`[copy-starters] ${copied} starter skill(s) → apps/web/public/skills/`);
