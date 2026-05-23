# 06 — Design System

The visual + interaction language that ties web and desktop together.

---

## Brand essence

**One word:** *clarity*

**Three words:** *fast · honest · open*

**Voice:**
- Direct. No marketing buzzwords.
- Speaks like a senior engineer to peers.
- Comfortable with empty space. Doesn't fill every pixel.
- Slight technical pride ("deterministic compiler", "no telemetry") — not anti-AI, but pro-control.

## Anti-patterns to avoid

- ❌ Gradient hero with glassmorphism (too 2022)
- ❌ "✨ Sparkles ✨ AI-powered" anywhere
- ❌ Sliding/parallax background animations
- ❌ Auto-playing videos
- ❌ "Sign up for early access" CTAs (we don't have signup)
- ❌ Cookie banners (we don't track)
- ❌ Floating chat widgets

The aesthetic is **terminal-adjacent, IDE-adjacent**. Think: Linear, Vercel, Raycast docs, Cursor's landing page, dev.to.

---

## Color tokens

```css
@theme {
  /* Backgrounds */
  --color-bg:        #0a0a0b;   /* main */
  --color-bg-elev:   #14141a;   /* header, sidebar, status bar */
  --color-bg-elev-2: #1d1d26;   /* hover, active selects */
  --color-border:    #2a2a36;   /* dividers */

  /* Text */
  --color-text:       #e6e6f0;  /* primary */
  --color-text-dim:   #9696aa;  /* secondary, labels */
  --color-text-faint: #5a5a6e;  /* meta, captions */

  /* Brand */
  --color-accent:     #ff6b35;  /* crosskill orange — buttons, focus, key actions */
  --color-accent-dim: #ff6b3522;

  /* Semantic */
  --color-success: #4ade80;     /* green — "lint clean", "saved" */
  --color-warn:    #fbbf24;     /* amber — lint warnings */
  --color-error:   #f87171;     /* red — parse errors */
}
```

**Why orange (#ff6b35):**
- Stands out against the dark IDE-style background
- Matches "compile / forge / transform" semantics (heat, action)
- Distinct from competitors (most use blue/purple/green)
- Works in Arabic RTL contexts (no cultural baggage)

**Light mode:** Not for v0.4. Add in v0.5 if requested. Most devs use dark by default.

---

## Typography

```css
--font-sans: "Inter", system-ui, sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", ui-monospace, monospace;
```

**Scale (rem):**
```
xs:   0.75    /* meta, captions */
sm:   0.875   /* labels, buttons */
base: 1.0     /* body */
lg:   1.125   /* secondary headings */
xl:   1.25    /* primary headings */
2xl:  1.5     /* hero */
3xl:  2.0     /* big hero only */
```

**Weights used:**
- 400 — body
- 500 — UI labels, button text
- 600 — section headings, hero
- 700 — only the wordmark "crosskill"

No weight 300 (too thin on dark backgrounds).
No italics in UI (only in body markdown).

---

## Spacing scale (Tailwind defaults work — no overrides)

`0`, `1` (4px), `2` (8px), `3` (12px), `4` (16px), `6` (24px), `8` (32px), `12` (48px), `16` (64px)

**Vertical rhythm:** sections separated by `py-8` minimum. Card padding `p-6`. Inline gaps `gap-2` to `gap-3`.

---

## Iconography

**Library:** lucide-react (already in stack)

**Size:** 14px for inline, 16px for buttons, 20px for primary actions, 32px for empty states.

**Stroke:** default 1.5. Never use filled icons (mismatches the aesthetic).

**Color:** inherit from text color. Accent color only on primary CTA buttons.

---

## Component patterns

### Button — primary

```tsx
<button className="
  flex items-center gap-2 px-3 py-1.5
  bg-[var(--color-accent)] text-[var(--color-bg)]
  hover:opacity-90 active:opacity-80
  rounded font-medium text-sm
  transition-opacity
  disabled:opacity-40 disabled:cursor-not-allowed
">
  <Download size={14} /> Download
</button>
```

### Button — secondary

```tsx
<button className="
  flex items-center gap-1.5 px-2 py-1
  bg-[var(--color-bg-elev-2)] hover:bg-[var(--color-border)]
  border border-[var(--color-border)]
  text-[var(--color-text-dim)] hover:text-[var(--color-text)]
  rounded text-xs
">
  <Share2 size={12} /> Share
</button>
```

### Tab strip

```tsx
<button className={`
  px-3 py-2 text-xs whitespace-nowrap
  border-r border-[var(--color-border)]
  ${active
    ? "bg-[var(--color-bg)] text-[var(--color-text)]"
    : "text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
  }
`}>
  cursor
</button>
```

### Status pill (e.g., "✓ Lint clean")

```tsx
<span className="
  inline-flex items-center gap-1 px-2 py-0.5
  text-xs text-[var(--color-success)]
">
  ✓ Lint clean
</span>
```

### Status bar (bottom of app)

```tsx
<footer className="
  border-t border-[var(--color-border)]
  bg-[var(--color-bg-elev)]
  px-4 py-2
  text-xs text-[var(--color-text-faint)]
  flex items-center justify-between
">
  <span>Compiled to 7 target(s) in 3ms</span>
  <span>v0.4.0</span>
</footer>
```

---

## Layout

### Web playground

- Header: 56px fixed, full width, `bg-elev`
- Body: 50/50 vertical split. Editor left, outputs right.
- Footer: 36px status bar, full width, `bg-elev`
- Mobile (<768px): stack editor on top, outputs below

### Desktop app

- Title bar: native (Tauri-provided)
- Body: 3-column on wide (≥1100px), 2-column on narrow
  - Left sidebar: 240px workspace tree
  - Middle: editor
  - Right: collapsible outputs panel
- Status bar: same as web

---

## Copy guidelines

### Microcopy

**Do say:**
- "Compiled to 7 target(s)"
- "Lint clean"
- "Saved 21 file(s)"
- "Edit the skill on the left to see compiled outputs"

**Don't say:**
- "Awesome! Your skill is ready 🎉"
- "Compiling magic..."
- "Hold tight while we work our magic"
- "Oops! Something went wrong"

### Error messages

Format: `⨯ <category>: <one-line summary>`

Examples:
- `⨯ Parse error: name must be kebab-case`
- `⨯ Lint error: at least one target must be enabled`
- `⨯ Write failed: permission denied`

Never use exclamation marks in errors. Lowercase first letter after the colon.

### Empty states

Use lucide icons at 32px with `opacity-30`. One sentence below. No "Get started" buttons (the UI already shows the user what to do).

---

## Arabic / RTL

When the playground or app is loaded with Arabic copy:

- Set `<html lang="ar" dir="rtl">`
- Text aligns right.
- Editor stays LTR (code is LTR even in Arabic).
- Icons mirror horizontally for direction-sensitive ones (arrows). Lucide handles this if you pass `dir="rtl"` on the parent.
- Use Najdi dialect, not MSA, for any human-facing copy.

Example Najdi UI strings:

| EN | Najdi |
|---|---|
| Open folder | افتح المجلد |
| Save | احفظ |
| Compiled | جاهز |
| Lint clean | نظيف |
| Watching for changes | نراقب التغييرات |
| Download ZIP | حمّل |
| Share | شارك |

---

## Animation

**Default:** `transition-opacity` and `transition-colors` only. Never `transition-all`.

**Duration:** 100–150ms. Anything longer feels sluggish in a dev tool.

**Easing:** browser default. No custom curves.

**Never animate:**
- Layout shifts
- Page transitions
- Tab switches (jarring in IDEs)

**OK to animate:**
- Hover states (opacity, color)
- Status changes (background pulse for "saved")
- Modal appear/disappear (fade only)

---

## Accessibility minimums

- All interactive elements reachable via Tab
- Focus ring uses `--color-accent` (browser default outline, do not `outline: none`)
- Color contrast WCAG AA on all text (dark mode passes naturally)
- Buttons have aria-labels where icon-only
- Editor honors prefers-reduced-motion (disable any animations)
- Keyboard shortcuts: Cmd/Ctrl+S = save (desktop), Cmd/Ctrl+B = build (CLI mode)

---

## Logo

The crosskill logo for v0.4 launch:

```
Square orange box (#ff6b35) with two overlapping rounded squares
forming an "x" shape, white inner cutouts.
Always paired with the "crosskill" wordmark in JetBrains Mono regular,
all lowercase.
```

Hand off to Aziz's azizme-design skill to generate variants (favicon SVG, OG PNG, app icon 1024px).

---

## File of UI strings (single source of truth)

Create `apps/web/app/lib/i18n.ts`:

```ts
export const STRINGS = {
  en: {
    header: { docs: "Docs", github: "GitHub" },
    editor: { loadStarter: "Load starter…", share: "Share" },
    outputs: { copy: "Copy", download: "Download ZIP", empty: "Edit the skill on the left to see compiled outputs." },
    status: { parsed: "✓ Parsed", lintClean: "Lint clean", lintNotes: (n: number) => `${n} lint note(s)`, compiled: (n: number) => `Compiled to ${n} target(s)` },
    footer: { left: "MIT · open source · runs entirely in your browser · zero telemetry", right: "built by aziz" },
  },
  ar: {
    header: { docs: "التوثيق", github: "GitHub" },
    editor: { loadStarter: "اختر مثال…", share: "شارك" },
    outputs: { copy: "نسخ", download: "حمّل", empty: "عدّل الـ skill على اليسار عشان تشوف المخرجات." },
    status: { parsed: "✓ جاهز", lintClean: "نظيف", lintNotes: (n: number) => `${n} ملاحظة`, compiled: (n: number) => `طلع لك ${n} ملف` },
    footer: { left: "مفتوح المصدر · يشتغل بالكامل في المتصفح · بدون متابعة", right: "صناعة عزيز" },
  },
};
```

For v0.4 launch, ship EN only. Add `ar` toggle in v0.5.
