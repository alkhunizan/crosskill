# 03 — Phase 2: Web Playground (crosskill.dev)

**Goal:** A fully client-side playground where any visitor pastes a `*.skill.md`, sees all 7 compiled outputs in tabs, and downloads them as a ZIP. Zero backend.

**Time estimate:** ~3 hours
**Risk level:** Low
**Deliverable:** `crosskill.dev` (or `crosskill.netlify.app` if domain not set up) live with a working playground. Tagged release `v0.3.0`.

---

## What we're building

```
┌─────────────────────────────────────────────────────────────────────┐
│  crosskill                                  [Star on GitHub]  [Docs] │
├──────────────────────────────────┬──────────────────────────────────┤
│ YOUR SKILL.MD                    │ COMPILED OUTPUTS (7)             │
│                                  │                                  │
│ ┌──────────────────────────────┐ │ ┌─[claude] [cursor] [codex] ▶┐  │
│ │ ---                          │ │ │                            │  │
│ │ name: code-reviewer          │ │ │ .claude/skills/code-       │  │
│ │ targets:                     │ │ │      reviewer/SKILL.md     │  │
│ │   claude: true               │ │ │                            │  │
│ │ ---                          │ │ │ ---                        │  │
│ │ You are a code reviewer.     │ │ │ name: code-reviewer        │  │
│ │ ...                          │ │ │ description: "..."         │  │
│ └──────────────────────────────┘ │ │ ---                        │  │
│                                  │ │                            │  │
│ [📂 Open .skill.md]              │ │ You are a code reviewer... │  │
│ [📚 Load starter…]               │ │                            │  │
│ [🔗 Share]                       │ │ [📋 Copy] [⬇ Download all] │  │
├──────────────────────────────────┴──────────────────────────────────┤
│ ✓ Lint clean   ·  Compiled to 7 targets in 3ms                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Tech stack (final)

- **Next.js 14** App Router, `output: 'export'` (static)
- **React 18**
- **Tailwind v4** with the azizme-design tokens
- **Monaco Editor** via `@monaco-editor/react` (lazy-loaded)
- **JSZip** for browser-side ZIP creation
- **lz-string** for share-URL hash encoding
- **lucide-react** for icons (matches existing Aziz stack)
- **Deploy:** Netlify, GitHub auto-deploy from main

No state management library. Local `useState` is enough for a single-page playground.

---

## Step-by-step

### 1. Create the app

```bash
cd C:\Users\alkhu\Projects\crosskill
mkdir apps && cd apps
bun create next-app web --typescript --tailwind --app --no-eslint --src-dir false --import-alias "@/*"
cd web
```

When prompted, answer:
- Tailwind: **Yes**
- App Router: **Yes**
- `src/` directory: **No** (we use `app/` at root)
- Import alias: `@/*`

### 2. Install dependencies

```bash
bun add @crosskill/core@workspace:* @crosskill/skills@workspace:*
bun add @monaco-editor/react monaco-editor jszip lz-string lucide-react
bun add -d @types/jszip @types/lz-string
```

### 3. Configure Next.js for static export

`apps/web/next.config.mjs`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: false,
  reactStrictMode: true,
  // Monaco needs this for proper worker loading on static hosts
  experimental: { esmExternals: true },
};
export default nextConfig;
```

### 4. Configure Netlify

`apps/web/netlify.toml`:

```toml
[build]
  command = "cd ../.. && bun install && bun run build --filter @crosskill/core && cd apps/web && bun run build"
  publish = "out"
  base = "apps/web"

[build.environment]
  NODE_VERSION = "20"
  BUN_VERSION = "latest"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "interest-cohort=()"

[[redirects]]
  from = "/docs/*"
  to = "https://github.com/alkhunizan/crosskill/blob/main/docs/:splat"
  status = 301
  force = false
```

### 5. Theme & global styles

`apps/web/app/globals.css`:

```css
@import "tailwindcss";

@theme {
  --color-bg: #0a0a0b;
  --color-bg-elev: #14141a;
  --color-bg-elev-2: #1d1d26;
  --color-border: #2a2a36;
  --color-text: #e6e6f0;
  --color-text-dim: #9696aa;
  --color-text-faint: #5a5a6e;
  --color-accent: #ff6b35;       /* crosskill orange */
  --color-accent-dim: #ff6b3522;
  --color-success: #4ade80;
  --color-warn: #fbbf24;
  --color-error: #f87171;

  --font-sans: "Inter", system-ui, -apple-system, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", ui-monospace, monospace;
}

html { background: var(--color-bg); color: var(--color-text); font-family: var(--font-sans); }
body { min-height: 100vh; }
*::selection { background: var(--color-accent); color: var(--color-bg); }
```

### 6. Root layout

`apps/web/app/layout.tsx`:

```tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "crosskill — one skill, every tool",
  description:
    "Write AI coding-agent skills once. Compile to Claude Code, Cursor, Codex, Windsurf, Aider, OpenCode, Gemini CLI. Free, open source, no install.",
  openGraph: {
    title: "crosskill",
    description: "One skill, every tool. Free, open source.",
    url: "https://crosskill.dev",
    siteName: "crosskill",
  },
  twitter: { card: "summary_large_image", creator: "@azizme_com" },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### 7. The playground page

`apps/web/app/page.tsx`:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Github, Download, Share2, BookOpen, FileText, Sparkles } from "lucide-react";
import { parseSkillString, compileSkill, lintSkill, type CompileResult, type LintIssue } from "@crosskill/core";
import { downloadZip } from "@/app/lib/zip-output";
import { encodeShareUrl, decodeShareUrl } from "@/app/lib/share-url";
import { STARTER_SKILLS, getStarterSkillSource } from "@/app/lib/starters";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const DEFAULT_SKILL = `---
name: code-reviewer
version: 0.1.0
description: Structured code review with bugs, performance, and style sections
targets:
  claude: true
  cursor: true
  codex: true
  windsurf: true
  aider: true
  opencode: true
  gemini: true
---

You are an expert code reviewer.

When given code:

1. Identify bugs and security issues — quote the exact line.
2. Suggest performance improvements with estimated impact.
3. Flag style and consistency issues.
4. Output: \`## Bugs\`, \`## Performance\`, \`## Style\`, \`## Nits\`.

## Examples

**Input:** a function with a race condition.
**Output:** flag the shared mutable state, propose a lock.
`;

export default function Playground() {
  const [source, setSource] = useState(DEFAULT_SKILL);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Load from URL hash on mount
  useEffect(() => {
    const fromHash = decodeShareUrl(window.location.hash);
    if (fromHash) setSource(fromHash);
  }, []);

  // Debounced compile
  const [debouncedSource, setDebouncedSource] = useState(source);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSource(source), 150);
    return () => clearTimeout(t);
  }, [source]);

  const { results, issues } = useMemo(() => {
    try {
      const skill = parseSkillString(debouncedSource);
      setError(null);
      return { results: compileSkill(skill, ""), issues: lintSkill(skill) };
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      return { results: [] as CompileResult[], issues: [] as LintIssue[] };
    }
  }, [debouncedSource]);

  const active = results[activeTab];

  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--color-border)] flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-[var(--color-accent)]" />
          <h1 className="text-lg font-semibold">crosskill</h1>
          <span className="text-[var(--color-text-faint)] text-sm">one skill, every tool</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <a href="https://github.com/alkhunizan/crosskill/blob/main/docs/format.md" className="flex items-center gap-1 text-[var(--color-text-dim)] hover:text-[var(--color-text)]">
            <BookOpen size={14} /> Docs
          </a>
          <a href="https://github.com/alkhunizan/crosskill" className="flex items-center gap-1 text-[var(--color-text-dim)] hover:text-[var(--color-text)]">
            <Github size={14} /> GitHub
          </a>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-2 gap-px bg-[var(--color-border)]">
        {/* LEFT — Editor */}
        <section className="bg-[var(--color-bg)] flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-bg-elev)]">
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-dim)]">
              <FileText size={14} /> code-reviewer.skill.md
            </div>
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  const s = getStarterSkillSource(e.target.value);
                  if (s) setSource(s);
                  e.target.value = "";
                }}
                className="bg-[var(--color-bg-elev-2)] border border-[var(--color-border)] rounded px-2 py-1 text-xs"
                defaultValue=""
              >
                <option value="" disabled>Load starter…</option>
                {STARTER_SKILLS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button
                onClick={() => {
                  const url = `${window.location.origin}/${encodeShareUrl(source)}`;
                  navigator.clipboard.writeText(url);
                }}
                className="flex items-center gap-1 text-xs bg-[var(--color-bg-elev-2)] hover:bg-[var(--color-border)] border border-[var(--color-border)] rounded px-2 py-1"
              >
                <Share2 size={12} /> Share
              </button>
            </div>
          </div>
          <div className="flex-1">
            <Editor
              defaultLanguage="markdown"
              theme="vs-dark"
              value={source}
              onChange={(v) => setSource(v ?? "")}
              options={{
                fontSize: 13,
                fontFamily: "var(--font-mono)",
                minimap: { enabled: false },
                wordWrap: "on",
                lineNumbers: "on",
                padding: { top: 12 },
                scrollBeyondLastLine: false,
              }}
            />
          </div>
          <div className="border-t border-[var(--color-border)] px-4 py-2 text-xs flex items-center gap-3">
            {error ? (
              <span className="text-[var(--color-error)]">⨯ {error.split("\n")[0]}</span>
            ) : (
              <>
                <span className="text-[var(--color-success)]">✓ Parsed</span>
                <span className="text-[var(--color-text-faint)]">{issues.length === 0 ? "Lint clean" : `${issues.length} lint note(s)`}</span>
                <span className="text-[var(--color-text-faint)]">Compiled to {results.length} target(s)</span>
              </>
            )}
          </div>
        </section>

        {/* RIGHT — Outputs */}
        <section className="bg-[var(--color-bg)] flex flex-col">
          <div className="flex items-center border-b border-[var(--color-border)] bg-[var(--color-bg-elev)] overflow-x-auto">
            {results.map((r, i) => (
              <button
                key={r.target + i}
                onClick={() => setActiveTab(i)}
                className={`px-3 py-2 text-xs whitespace-nowrap border-r border-[var(--color-border)] ${
                  i === activeTab ? "bg-[var(--color-bg)] text-[var(--color-text)]" : "text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
                }`}
              >
                {r.target}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2 px-3 py-2">
              <button
                onClick={() => active && navigator.clipboard.writeText(active.content)}
                className="text-xs text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
              >
                Copy
              </button>
              <button
                onClick={() => downloadZip(results, "crosskill-outputs")}
                className="flex items-center gap-1 text-xs bg-[var(--color-accent)] text-[var(--color-bg)] hover:opacity-90 rounded px-3 py-1 font-medium"
                disabled={results.length === 0}
              >
                <Download size={12} /> Download ZIP
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {active ? (
              <pre className="p-4 text-xs font-mono whitespace-pre-wrap text-[var(--color-text)]">
                <div className="text-[var(--color-text-faint)] mb-3 text-[10px] uppercase tracking-wider">{active.outputPath.replace(/\\/g, "/")}</div>
                {active.content}
              </pre>
            ) : (
              <div className="p-8 text-center text-[var(--color-text-faint)] text-sm">
                <Sparkles size={32} className="mx-auto mb-3 opacity-30" />
                Edit the skill on the left to see compiled outputs.
              </div>
            )}
          </div>
        </section>
      </div>

      <footer className="border-t border-[var(--color-border)] px-6 py-3 text-xs text-[var(--color-text-faint)] flex items-center justify-between">
        <span>MIT · open source · runs entirely in your browser · zero telemetry</span>
        <span>
          built by <a href="https://azizme.com" className="text-[var(--color-text-dim)] hover:text-[var(--color-text)]">aziz</a>
        </span>
      </footer>
    </main>
  );
}
```

### 8. Helpers

`apps/web/app/lib/zip-output.ts`:

```ts
import JSZip from "jszip";
import type { CompileResult } from "@crosskill/core";

export async function downloadZip(results: CompileResult[], filename: string) {
  if (results.length === 0) return;
  const zip = new JSZip();
  for (const r of results) {
    // Strip leading slashes/backslashes so the ZIP root is clean
    const path = r.outputPath.replace(/^[/\\]+/, "").replace(/\\/g, "/");
    zip.file(path, r.content);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

`apps/web/app/lib/share-url.ts`:

```ts
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";

export function encodeShareUrl(source: string): string {
  return `#s=${compressToEncodedURIComponent(source)}`;
}

export function decodeShareUrl(hash: string): string | null {
  if (!hash.startsWith("#s=")) return null;
  return decompressFromEncodedURIComponent(hash.slice(3)) || null;
}
```

`apps/web/app/lib/starters.ts`:

```ts
// At build time, copy starter skill .md files from packages/skills/ into apps/web/public/skills/
// then read them at runtime via fetch.
export const STARTER_SKILLS = [
  "code-reviewer",
  "commit-message",
  "pr-summarizer",
  "arabic-najdi-writer",
];

const cache = new Map<string, string>();

export async function getStarterSkillSource(name: string): Promise<string | null> {
  if (!STARTER_SKILLS.includes(name)) return null;
  if (cache.has(name)) return cache.get(name)!;
  const res = await fetch(`/skills/${name}.skill.md`);
  if (!res.ok) return null;
  const text = await res.text();
  cache.set(name, text);
  return text;
}
```

**Build-time step:** Add to `apps/web/package.json` scripts:

```json
"prebuild": "node scripts/copy-starters.mjs"
```

And `apps/web/scripts/copy-starters.mjs`:

```js
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const src = resolve(import.meta.dirname, "../../../packages/skills");
const dst = resolve(import.meta.dirname, "../public/skills");
mkdirSync(dst, { recursive: true });

for (const dir of readdirSync(src)) {
  const stat = statSync(join(src, dir));
  if (!stat.isDirectory()) continue;
  const file = join(src, dir, "skill.md");
  try {
    const content = readFileSync(file, "utf8");
    writeFileSync(join(dst, `${dir}.skill.md`), content, "utf8");
    console.log("✓ copied", dir);
  } catch {}
}
```

### 9. Favicon + OG image

- `apps/web/public/favicon.svg` — square orange box with "x" mark, no text
- `apps/web/public/og.png` — 1200x630, dark background, "crosskill" wordmark, tagline "one skill, every tool", small logos of the 7 supported tools

Aziz can create these via his azizme-design skill, or use any quick mockup. If skipped, leave a TODO note. Don't block deploy.

### 10. Sync starter skills into public/

Before first build:

```bash
cd apps/web
node scripts/copy-starters.mjs
```

### 11. Local verify

```bash
cd apps/web
bun run dev
# Open http://localhost:3000
```

Test:
- ✅ Default skill compiles to 7 tabs
- ✅ Edit text → outputs update live (~150ms debounce)
- ✅ "Load starter" dropdown populates and loads skills
- ✅ "Share" button copies URL with hash
- ✅ Open URL with hash → editor pre-populated
- ✅ "Download ZIP" produces a valid zip with correct folder structure
- ✅ Invalid front-matter shows error in status bar, no crash
- ✅ Empty body shows error, no crash

### 12. Build

```bash
bun run build
```

Output goes to `apps/web/out/`. Should be ~800 KB total (mostly Monaco, lazy-loaded).

### 13. Deploy to Netlify

**Option A — Via Netlify CLI (faster, deterministic):**

```bash
npm install -g netlify-cli
cd apps/web
netlify init      # link to a new site
netlify deploy --prod --dir=out
```

**Option B — Via GitHub auto-deploy (recommended for long-term):**

1. Push the monorepo to GitHub.
2. Go to Netlify dashboard → New site from Git → pick the `crosskill` repo.
3. Set base directory: `apps/web`, build command: (already in netlify.toml), publish dir: `out`.
4. Add custom domain: `crosskill.dev` (after Aziz buys it). Auto-issues SSL via Let's Encrypt.

### 14. Update root README

Add a new "Try it instantly" section near the top:

```md
## Try it instantly

**Web playground:** [crosskill.dev](https://crosskill.dev) — paste a skill, download outputs.
**CLI:** `npx crosskill init`
**Desktop:** [crosskill.app](https://crosskill.app) (coming)
```

### 15. Commit + push + tag

```bash
git add -A
git commit -m "feat(web): add browser playground at crosskill.dev

- Monaco editor with live compile preview
- 7-tab output view for every target
- Download all outputs as ZIP (JSZip)
- Share via URL hash (lz-string)
- Starter skill gallery
- Pure client-side: no backend, no telemetry, works offline after first load
- Netlify static deploy"

git tag v0.3.0 -m "v0.3.0 — web playground live"
git push --tags
```

---

## Phase 2 acceptance checklist

- [ ] `apps/web` builds cleanly with `bun run build`
- [ ] Deployed to a public URL (Netlify default or `crosskill.dev`)
- [ ] Bundle size under 1 MB initial JS (excluding Monaco workers which lazy-load)
- [ ] Lighthouse Performance ≥ 90, Accessibility ≥ 95
- [ ] All UI works without an internet connection (after first load)
- [ ] Share URL works across browsers
- [ ] Mobile-friendly (does not break on 375px width — Monaco stacks below editor on mobile is fine)
- [ ] README updated
- [ ] Tag `v0.3.0` pushed

---

## Mobile considerations

For Phase 2, mobile is "doesn't break". For Phase 4 polish, swap the side-by-side layout to stacked on screens < 768px:

```tsx
<div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-px bg-[var(--color-border)]">
```

Monaco on mobile is mediocre but acceptable. Most users will be on desktop.

---

## Risks & gotchas

1. **Monaco bundle is heavy.** It loads its own web workers. On Netlify, ensure CORP headers don't break worker loading (Tailwind+Next config above is fine).
2. **gray-matter pulls in `js-yaml`.** ~30 KB gzipped. Acceptable.
3. **First contentful paint** must stay < 1.5s. Lazy-load Monaco. Show a "Loading editor…" placeholder.
4. **SEO:** static export means we control the `<meta>` tags. Add OG/Twitter cards. Submit `sitemap.xml` later.

---

## What's next

Phase 3: desktop app (Tauri 2). See `PLAN/04_PHASE3_DESKTOP.md`.
