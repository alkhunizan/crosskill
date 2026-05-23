# 07 — Operations

CI, releases, distribution, signing, monitoring. Everything that keeps the project healthy after launch.

---

## GitHub repository settings (do once)

Settings to apply manually via `gh` or the web UI:

```bash
# Branch protection on main
gh api repos/alkhunizan/crosskill/branches/main/protection \
  --method PUT \
  --field required_status_checks[strict]=true \
  --field required_status_checks[contexts][]=ci \
  --field enforce_admins=false \
  --field required_pull_request_reviews=null \
  --field restrictions=null

# Discussions on for community
gh repo edit alkhunizan/crosskill --enable-discussions

# Auto-delete head branches after merge
gh repo edit alkhunizan/crosskill --delete-branch-on-merge

# Issues + PR templates (already in PLAN, copy these to .github/)
```

Add a `.github/FUNDING.yml`:

```yaml
github: [alkhunizan]
custom: ["https://azizme.com"]
```

---

## Issue & PR templates

### `.github/ISSUE_TEMPLATE/bug_report.md`

```markdown
---
name: Bug report
about: Something doesn't work as expected
labels: bug
---

**What happened**

<!-- Describe the bug in one sentence -->

**Steps to reproduce**

1.
2.
3.

**Skill that triggered it**

```yaml
---
name: ...
---
```

**Expected**

**Actual**

**Environment**

- crosskill version:
- Surface: CLI / web / desktop
- OS:
- Node version:
```

### `.github/ISSUE_TEMPLATE/new_target.md`

```markdown
---
name: New compiler target
about: Add support for a new AI coding tool
labels: enhancement, target
---

**Tool name**

**Tool homepage**

**Expected output path** (e.g. `.foo/skills/<name>.md`)

**Output format**

<!-- Paste a real example file that this tool reads -->

**Anything special** (frontmatter requirements, file conventions, single-file vs multi-file, etc.)
```

### `.github/ISSUE_TEMPLATE/new_skill.md`

```markdown
---
name: New starter skill
about: Propose a skill to ship in @crosskill/skills
labels: enhancement, skill
---

**Skill name** (kebab-case)

**What it does** (one sentence)

**Why it's broadly useful** (most teams need it)

**Draft body**

<!-- Paste the .skill.md draft -->
```

### `.github/ISSUE_TEMPLATE/feature_request.md`

```markdown
---
name: Feature request
about: Suggest a new capability
labels: enhancement
---

**Problem**

**Proposed solution**

**Alternatives considered**
```

### `.github/pull_request_template.md`

```markdown
## What

<!-- One sentence -->

## Why

<!-- Linked issue, or motivation -->

## How

<!-- Approach. Note any tradeoffs. -->

## Checklist

- [ ] Tests pass (`bun test`)
- [ ] Typecheck passes (`bun run typecheck`)
- [ ] README updated if user-facing
- [ ] CHANGELOG entry added
- [ ] Conventional Commit message
```

---

## CI architecture

Two workflows:

1. **`ci.yml`** — runs on every PR and push to main.
2. **`release.yml`** — runs only on `v*` tags.

### `ci.yml` (already created in Phase 1)

Verifies typecheck + tests + build on Node 18/20/22. Includes the CLI smoke test.

### `release.yml`

Already drafted in Phase 3. Builds desktop installers for all 3 OS on tag push. Publishes to GitHub Release.

Add an **npm publish** step that runs on tag push:

```yaml
publish-npm:
  runs-on: ubuntu-latest
  needs: build-desktop
  steps:
    - uses: actions/checkout@v4
    - uses: oven-sh/setup-bun@v2
      with: { bun-version: latest }
    - uses: actions/setup-node@v4
      with:
        node-version: 20
        registry-url: https://registry.npmjs.org

    - run: bun install
    - run: bun run --filter '@crosskill/core' build
    - run: bun run --filter 'crosskill' build

    - name: Publish @crosskill/core
      run: cd packages/core && npm publish --access public
      env:
        NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

    - name: Publish crosskill
      run: cd packages/cli && npm publish --access public
      env:
        NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

    - name: Publish @crosskill/skills
      run: cd packages/skills && npm publish --access public
      env:
        NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## Secrets required in GitHub

| Secret | Purpose | How to obtain |
|---|---|---|
| `NPM_TOKEN` | Publish to npm | npmjs.com → Access Tokens → Generate (Automation type) |
| `TAURI_SIGNING_PRIVATE_KEY` | Sign desktop update manifests | Generated via `tauri signer generate` (Phase 3 step 14) |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Decrypt the above | Set during keygen |
| `NETLIFY_AUTH_TOKEN` | Only if not using Git-linked deploys | netlify.com → User settings → Applications |
| `NETLIFY_SITE_ID` | Only if not using Git-linked deploys | netlify.com site → Site information |

**Optional (post-launch, code-signing):**
| `WINDOWS_CERT_PFX_BASE64` | Sign Windows .msi | Buy EV cert ($300/yr) |
| `WINDOWS_CERT_PASSWORD` | Decrypt the above | Set when ordering |
| `APPLE_ID` | Notarize macOS | Apple Developer account |
| `APPLE_PASSWORD` | App-specific password | appleid.apple.com → Sign-In and Security |
| `APPLE_TEAM_ID` | Apple Developer team | developer.apple.com |
| `APPLE_CERTIFICATE` | Developer ID cert | Apple Developer → Certificates |
| `APPLE_CERTIFICATE_PASSWORD` | Decrypt the above | Set during export |

Skip signing for v0.4 launch. Add for v0.5 if traction warrants.

---

## Release procedure

Whenever you're ready to ship a new version:

```bash
# 1. Decide the version bump (semver)
#    - core compiler change → minor (0.4 → 0.5)
#    - new surface, new feature → minor
#    - bug fix only → patch (0.4.0 → 0.4.1)
#    - breaking API → major (0.x → 1.0 only once stable)

# 2. Update version in 4 places (keep them in lockstep):
#    - packages/core/package.json
#    - packages/cli/package.json
#    - apps/desktop/package.json
#    - apps/desktop/src-tauri/Cargo.toml (version)
#    - apps/desktop/src-tauri/tauri.conf.json (version)

# Suggested helper: a tiny script that does this for you
bun scripts/bump-version.ts 0.5.0

# 3. Update CHANGELOG.md with the new version's changes (Keep a Changelog format)

# 4. Commit
git add -A
git commit -m "chore: release v0.5.0"

# 5. Tag (triggers release.yml in CI)
git tag v0.5.0 -m "v0.5.0 — <one-line summary>"

# 6. Push (commits + tags)
git push && git push --tags

# 7. Watch the CI run
gh run watch

# 8. After CI finishes:
#    - npm: 3 packages published
#    - GitHub Releases: installers attached
#    - Netlify: web auto-deployed
```

### Bump-version script (optional but useful)

`scripts/bump-version.ts`:

```ts
import { readFileSync, writeFileSync } from "node:fs";

const newVersion = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(newVersion ?? "")) {
  console.error("Usage: bun scripts/bump-version.ts 0.5.0");
  process.exit(1);
}

const files = [
  "packages/core/package.json",
  "packages/cli/package.json",
  "packages/skills/package.json",
  "apps/desktop/package.json",
];

for (const file of files) {
  const pkg = JSON.parse(readFileSync(file, "utf8"));
  pkg.version = newVersion;
  writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n");
  console.log(`✓ ${file} → ${newVersion}`);
}

// Tauri Cargo.toml — simple regex
const cargo = readFileSync("apps/desktop/src-tauri/Cargo.toml", "utf8");
writeFileSync(
  "apps/desktop/src-tauri/Cargo.toml",
  cargo.replace(/^version\s*=\s*".*"/m, `version = "${newVersion}"`),
);
console.log(`✓ apps/desktop/src-tauri/Cargo.toml → ${newVersion}`);

// Tauri config JSON
const tauri = JSON.parse(readFileSync("apps/desktop/src-tauri/tauri.conf.json", "utf8"));
tauri.version = newVersion;
writeFileSync("apps/desktop/src-tauri/tauri.conf.json", JSON.stringify(tauri, null, 2) + "\n");
console.log(`✓ apps/desktop/src-tauri/tauri.conf.json → ${newVersion}`);

console.log("\nNext: update CHANGELOG.md, commit, tag, push.");
```

---

## Web deployment

**Setup once:**

1. Push to GitHub.
2. Netlify → Add new site → Import from Git → pick `crosskill` repo.
3. Base directory: `apps/web`. (netlify.toml handles the rest.)
4. Set custom domain: `crosskill.dev`. (Or `crosskill.netlify.app` until domain bought.)
5. Enable HTTPS (auto via Let's Encrypt).
6. Set `Production branch: main`.

Every push to `main` triggers an auto-deploy. Deploys take ~90 seconds.

**Manual override if CI is broken:**

```bash
cd apps/web
bun run build
netlify deploy --prod --dir=out --message "manual deploy"
```

---

## Domain setup

Both domains live at GoDaddy/Vercel/Cloudflare — pick one and consolidate:

### crosskill.dev (web playground)

DNS records:
```
A      @       75.2.60.5            (Netlify load balancer)
CNAME  www     <site>.netlify.app   (Netlify provides this)
```

Or use Netlify nameservers (easier). In domain registrar, set nameservers to:
```
dns1.p01.nsone.net
dns2.p01.nsone.net
dns3.p01.nsone.net
dns4.p01.nsone.net
```

### crosskill.app (desktop downloads landing)

Option A: alias to crosskill.dev/download with a redirect.
Option B: separate static site (just a download page).

**Recommended:** Option A — fewer moving parts.

In domain registrar:
```
URL Redirect: crosskill.app → https://crosskill.dev/download (301 permanent)
```

---

## npm publishing

Three packages. First-time publish, run locally (CI does subsequent ones):

```bash
# Log in
npm login

# Verify scope availability
npm view @crosskill/core
# (Should 404 the first time)

# Dry-run check
cd packages/core && npm publish --dry-run
cd ../cli && npm publish --dry-run
cd ../skills && npm publish --dry-run

# Real publish
cd packages/core && npm publish --access public
cd ../cli && npm publish --access public
cd ../skills && npm publish --access public
```

After first publish, generate an Automation token (`npmjs.com → Access Tokens → Generate → Automation`) and store as `NPM_TOKEN` in GitHub secrets. CI handles all subsequent releases.

---

## Versioning policy

- **0.x.y** — pre-1.0, breaking changes allowed in minor bumps (we document them clearly).
- **1.0.0** — when we have a stable skill format that's been used in production for 3 months and we commit to a deprecation policy.
- **CHANGELOG.md** updated every release. Use [Keep a Changelog](https://keepachangelog.com/) format.

CHANGELOG.md skeleton:

```markdown
# Changelog

## [Unreleased]

## [0.4.0] — 2026-XX-XX

### Added
- Desktop app (Tauri 2) for Windows, macOS, Linux
- Watch mode that recompiles on .skill.md save
- System tray integration

### Changed
- Refactored to monorepo (`packages/core`, `packages/cli`, `packages/skills`)

## [0.3.0] — 2026-XX-XX

### Added
- Web playground at crosskill.dev
- Monaco editor with live compile
- Download all outputs as ZIP

## [0.2.0] — 2026-XX-XX

### Changed
- Split into monorepo

## [0.1.0] — 2026-XX-XX

### Added
- Initial CLI release with 7 compilers
- 4 starter skills
```

---

## Monitoring & analytics

**v0.4 launch: zero telemetry.** Don't add Plausible/PostHog/anything. Use:

- **GitHub Stars + Insights** for repo traffic
- **Netlify Analytics** (paid $9/mo, optional) for crosskill.dev traffic without cookies/JS
- **npm stats** at npmjs.com/package/crosskill
- **GitHub Release download counts** per asset

If we later need product analytics (paid features), use **Plausible** — privacy-respecting, no cookies, no consent banner needed.

---

## Crisis playbook

If something breaks publicly post-launch:

1. **Hotfix branch.** `git checkout -b hotfix/X main`
2. **Reproduce + test.** Don't push speculative fixes.
3. **PR with `[hotfix]` label.** Merge fast.
4. **Patch release.** `git tag v0.4.1 && git push --tags`
5. **Pin tweet/HN comment** with the fix link.
6. **Post-mortem in 24h** — short blog post on dev.to, builds trust.

If a security issue is reported:

1. Don't discuss publicly.
2. Add a SECURITY.md with `hello@azizme.com` as the contact.
3. Coordinate disclosure with the reporter.
4. Patch privately, release, then post advisory.

`SECURITY.md`:

```markdown
# Security Policy

## Reporting

Email security issues to **hello@azizme.com**. Do not open public issues for security reports.

You should receive an acknowledgment within 48 hours.

## Supported versions

The latest minor release receives security updates.
```

---

## Cost of running this project

| Item | Cost |
|---|---|
| GitHub (public repos) | Free |
| GitHub Actions (3 OS runners, ~15 min per release) | Free (well within 2,000 min/mo limit) |
| Netlify (static site, < 100 GB bw) | Free |
| crosskill.dev domain | $9.99/yr |
| crosskill.app domain | $9.99/yr |
| npm publishing | Free |
| **Total year 1** | **~$20** |

Optional add-ons if traction warrants:
| Apple Developer Program (notarize macOS) | $99/yr |
| Windows EV code-signing cert | ~$300/yr |
| Plausible (analytics) | $9/mo |

Stay free for the first 3 months. Add signing certs only when user count justifies it.
