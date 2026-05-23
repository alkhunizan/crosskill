#!/usr/bin/env bun
/**
 * Bump every version stamp in lockstep.
 *
 * Usage:
 *   bun scripts/bump-version.ts 0.5.0
 *
 * Touches:
 *   - root package.json (workspace metadata)
 *   - packages/core/package.json
 *   - packages/cli/package.json
 *   - packages/skills/package.json
 *   - apps/web/package.json
 *   - apps/desktop/package.json
 *   - apps/desktop/src-tauri/Cargo.toml
 *   - apps/desktop/src-tauri/tauri.conf.json
 *   - packages/cli/src/cli.ts          (Commander `.version(...)` literal)
 *   - packages/core/src/lockfile.ts    (CROSSKILL_VERSION literal)
 *
 * Does NOT run `bun install` afterward — that's deliberate. Run it yourself
 * so you can review the diff first.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const newVersion = process.argv[2];
if (!/^\d+\.\d+\.\d+(-[a-z0-9.-]+)?$/i.test(newVersion ?? "")) {
  console.error("Usage: bun scripts/bump-version.ts <semver>");
  console.error("  e.g. bun scripts/bump-version.ts 0.5.0");
  process.exit(1);
}

const root = resolve(import.meta.dirname, "..");

const packageJsonFiles = [
  "package.json",
  "packages/core/package.json",
  "packages/cli/package.json",
  "packages/skills/package.json",
  "apps/web/package.json",
  "apps/desktop/package.json",
];

for (const file of packageJsonFiles) {
  const path = resolve(root, file);
  if (!existsSync(path)) {
    console.warn(`  · ${file} not found, skipping`);
    continue;
  }
  const pkg = JSON.parse(readFileSync(path, "utf8"));
  pkg.version = newVersion;
  writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n");
  console.log(`✓ ${file} → ${newVersion}`);
}

const cargoToml = resolve(root, "apps/desktop/src-tauri/Cargo.toml");
if (existsSync(cargoToml)) {
  const text = readFileSync(cargoToml, "utf8");
  writeFileSync(
    cargoToml,
    text.replace(/^version\s*=\s*".*"/m, `version = "${newVersion}"`)
  );
  console.log(`✓ apps/desktop/src-tauri/Cargo.toml → ${newVersion}`);
}

const tauriConf = resolve(root, "apps/desktop/src-tauri/tauri.conf.json");
if (existsSync(tauriConf)) {
  const conf = JSON.parse(readFileSync(tauriConf, "utf8"));
  conf.version = newVersion;
  writeFileSync(tauriConf, JSON.stringify(conf, null, 2) + "\n");
  console.log(`✓ apps/desktop/src-tauri/tauri.conf.json → ${newVersion}`);
}

const cliTs = resolve(root, "packages/cli/src/cli.ts");
if (existsSync(cliTs)) {
  const text = readFileSync(cliTs, "utf8");
  writeFileSync(
    cliTs,
    text.replace(/\.version\("[^"]+"\)/, `.version("${newVersion}")`)
  );
  console.log(`✓ packages/cli/src/cli.ts → ${newVersion}`);
}

const lockfileTs = resolve(root, "packages/core/src/lockfile.ts");
if (existsSync(lockfileTs)) {
  const text = readFileSync(lockfileTs, "utf8");
  writeFileSync(
    lockfileTs,
    text.replace(
      /export const CROSSKILL_VERSION = "[^"]+";/,
      `export const CROSSKILL_VERSION = "${newVersion}";`
    )
  );
  console.log(`✓ packages/core/src/lockfile.ts → ${newVersion}`);
}

console.log(`\nNext steps:`);
console.log(`  1. Update CHANGELOG.md with the new version's entries.`);
console.log(`  2. Run \`bun install\` to refresh bun.lock.`);
console.log(`  3. Run \`bun test && bun run typecheck && bun run build\`.`);
console.log(`  4. Commit: \`git commit -am "chore: release v${newVersion}"\``);
console.log(`  5. Tag: \`git tag v${newVersion} -m "v${newVersion} — <summary>"\``);
console.log(`  6. Push: \`git push && git push --tags\`.`);
