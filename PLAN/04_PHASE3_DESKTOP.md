# 04 — Phase 3: Desktop App (Tauri 2)

**Goal:** A native desktop app for Windows, macOS, and Linux that reuses the web playground's UI and adds native file-system access + watch mode. Distributed via GitHub Releases.

**Time estimate:** ~4 hours (+1 hour first-time Tauri setup)
**Risk level:** Medium-high (cross-platform code signing has sharp edges)
**Deliverable:** `v0.4.0` tagged release with `.msi`, `.dmg`, `.AppImage` attached. `crosskill.app` landing page links to GitHub Releases for downloads.

---

## Tauri 2 prerequisites

Aziz's main machine is Windows. The first-time Rust + Tauri install:

```powershell
# Install Rust (one-time, takes ~5 min)
Invoke-WebRequest -Uri https://win.rustup.rs -OutFile rustup-init.exe
.\rustup-init.exe -y
del rustup-init.exe

# Verify
rustc --version
cargo --version

# Tauri CLI (per-project)
cd C:\Users\alkhu\Projects\crosskill\apps\desktop
bun add -d @tauri-apps/cli
```

**WebView2:** Pre-installed on Windows 10/11 since 2022. No action needed.

For macOS builds we use GitHub Actions on `macos-latest` runners. For Linux, `ubuntu-latest`. Aziz does not need a Mac.

---

## What the desktop app does

A workspace-aware editor for your skills:

```
┌─────────────────────────────────────────────────────────────────────┐
│ crosskill                          [Open folder…] [Watch: ON] [⚙]    │
├──────────────────────────────┬──────────────────────────────────────┤
│ ▼ C:\Users\alkhu\halagpt     │ code-reviewer.skill.md               │
│   ▼ polyskill/               │ ┌──────────────────────────────────┐ │
│     • code-reviewer.skill.md │ │ ---                              │ │
│     • commit-message.skill   │ │ name: code-reviewer              │ │
│     • najdi-writer.skill.md  │ │ ...                              │ │
│   📁 .claude/skills/         │ └──────────────────────────────────┘ │
│   📁 .cursor/rules/          │                                       │
│   📄 AGENTS.md (auto)        │ Outputs (auto-saved):                │
│   📁 .windsurf/rules/        │   ✓ .claude/skills/code-reviewer/    │
│                              │   ✓ .cursor/rules/code-reviewer.mdc  │
│ [+ New skill]                │   ✓ AGENTS.md                        │
│                              │   ✓ .windsurf/rules/code-reviewer.md │
│                              │   ✓ .aider/skills/code-reviewer.md   │
│                              │   ✓ .opencode/skills/code-reviewer.md│
│                              │   ✓ .gemini/skills/code-reviewer.md  │
├──────────────────────────────┴──────────────────────────────────────┤
│ Watching for changes · Compiled 3 skills · Saved 21 files            │
└─────────────────────────────────────────────────────────────────────┘
```

The desktop app's killer features over the web playground:

1. **Open Folder** — pick any repo, scan for `*.skill.md` files
2. **Edit + Auto-save** — every save recompiles + writes to disk immediately
3. **Watch mode** — file watcher on the folder, recompiles when external tools edit skills
4. **System tray** — minimize to tray, "Watching: 3 folders"
5. **Multi-workspace** — keep multiple repos open
6. **Native file dialogs** — feels like a real desktop app

---

## Step-by-step

### 1. Scaffold the Tauri app

```bash
cd C:\Users\alkhu\Projects\crosskill\apps
bun create tauri-app desktop
```

When prompted:
- **Frontend:** TypeScript / React / Vite
- **Manager:** bun
- **Project name:** `crosskill-desktop`
- **Window title:** `crosskill`
- **Identifier:** `dev.crosskill.desktop`

This creates `apps/desktop/` with `src/` (frontend) and `src-tauri/` (Rust).

### 2. Wire to monorepo

`apps/desktop/package.json` — set the package name and add core dep:

```json
{
  "name": "crosskill-desktop",
  "version": "0.4.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  },
  "dependencies": {
    "@crosskill/core": "workspace:*",
    "@crosskill/skills": "workspace:*",
    "@monaco-editor/react": "^4.6.0",
    "monaco-editor": "^0.50.0",
    "lucide-react": "^0.469.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@tauri-apps/api": "^2.0.0",
    "@tauri-apps/plugin-dialog": "^2.0.0",
    "@tauri-apps/plugin-fs": "^2.0.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.0",
    "vite": "^5.4.0"
  }
}
```

### 3. Tauri config

`apps/desktop/src-tauri/tauri.conf.json`:

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "crosskill",
  "version": "0.4.0",
  "identifier": "dev.crosskill.desktop",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:1420",
    "beforeDevCommand": "bun run dev",
    "beforeBuildCommand": "bun run build"
  },
  "app": {
    "windows": [
      {
        "title": "crosskill",
        "width": 1280,
        "height": 800,
        "minWidth": 900,
        "minHeight": 600,
        "decorations": true,
        "transparent": false
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": ["msi", "dmg", "appimage", "deb"],
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "shortDescription": "Write AI coding-agent skills once, compile to every tool",
    "longDescription": "crosskill is a cross-platform skill compiler for Claude Code, Cursor, Codex, Windsurf, Aider, OpenCode, and Gemini CLI. Write one skill.md, deploy to every AI tool. Free and open source.",
    "category": "DeveloperTool",
    "copyright": "© 2026 Aziz Al-Khunizan",
    "publisher": "Aziz Al-Khunizan",
    "windows": {
      "wix": { "language": "en-US" }
    },
    "macOS": {
      "minimumSystemVersion": "11.0",
      "entitlements": null,
      "providerShortName": null
    }
  },
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": ["https://github.com/alkhunizan/crosskill/releases/latest/download/latest.json"],
      "pubkey": "REPLACE_WITH_TAURI_PUBKEY"
    }
  }
}
```

### 4. Rust plugins — Cargo.toml

`apps/desktop/src-tauri/Cargo.toml`:

```toml
[package]
name = "crosskill"
version = "0.4.0"
description = "crosskill desktop"
edition = "2021"

[dependencies]
tauri = { version = "2", features = ["tray-icon"] }
tauri-plugin-dialog = "2"
tauri-plugin-fs = "2"
tauri-plugin-shell = "2"
tauri-plugin-updater = "2"
tauri-plugin-window-state = "2"
notify = "6"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
walkdir = "2"

[features]
custom-protocol = ["tauri/custom-protocol"]
```

### 5. Rust main — the file-system bridge

`apps/desktop/src-tauri/src/main.rs`:

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod fs_bridge;
mod watcher;

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            fs_bridge::open_workspace,
            fs_bridge::write_outputs,
            watcher::start_watching,
            watcher::stop_watching,
        ])
        .setup(|app| {
            #[cfg(desktop)]
            {
                use tauri::tray::TrayIconBuilder;
                let _tray = TrayIconBuilder::new()
                    .icon(app.default_window_icon().unwrap().clone())
                    .tooltip("crosskill")
                    .build(app)?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 6. fs_bridge.rs — the core IO commands

`apps/desktop/src-tauri/src/fs_bridge.rs`:

```rust
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

#[derive(Serialize, Deserialize)]
pub struct SkillFile {
    pub path: String,
    pub content: String,
}

#[derive(Serialize, Deserialize)]
pub struct Workspace {
    pub root: String,
    pub skills: Vec<SkillFile>,
}

#[derive(Serialize, Deserialize)]
pub struct WriteOutput {
    pub path: String,    // relative to workspace root
    pub content: String,
}

#[tauri::command]
pub fn open_workspace(root: String) -> Result<Workspace, String> {
    let root_path = PathBuf::from(&root);
    if !root_path.is_dir() {
        return Err(format!("Not a directory: {}", root));
    }

    let mut skills = Vec::new();
    for entry in WalkDir::new(&root_path).max_depth(4) {
        let entry = entry.map_err(|e| e.to_string())?;
        if !entry.file_type().is_file() { continue; }
        let name = entry.file_name().to_string_lossy();
        if !name.ends_with(".skill.md") && name != "skill.md" { continue; }

        let content = fs::read_to_string(entry.path()).map_err(|e| e.to_string())?;
        let rel = entry.path()
            .strip_prefix(&root_path)
            .map_err(|e| e.to_string())?
            .to_string_lossy()
            .replace('\\', "/");
        skills.push(SkillFile { path: rel, content });
    }
    skills.sort_by(|a, b| a.path.cmp(&b.path));

    Ok(Workspace { root, skills })
}

#[tauri::command]
pub fn write_outputs(root: String, outputs: Vec<WriteOutput>) -> Result<usize, String> {
    let root_path = PathBuf::from(&root);
    if !root_path.is_dir() {
        return Err(format!("Not a directory: {}", root));
    }
    let mut written = 0;
    for o in outputs {
        let abs = root_path.join(&o.path);
        if let Some(parent) = abs.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        // Security: prevent path traversal
        let canonical = abs.canonicalize().unwrap_or(abs.clone());
        if !canonical.starts_with(&root_path) && !abs.starts_with(&root_path) {
            return Err(format!("Refused to write outside workspace: {}", o.path));
        }
        fs::write(&abs, &o.content).map_err(|e| e.to_string())?;
        written += 1;
    }
    Ok(written)
}
```

### 7. watcher.rs — file watching with notify

`apps/desktop/src-tauri/src/watcher.rs`:

```rust
use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::Path;
use std::sync::Mutex;
use std::sync::mpsc::channel;
use tauri::{AppHandle, Emitter};

static WATCHER_STATE: Mutex<Option<RecommendedWatcher>> = Mutex::new(None);

#[tauri::command]
pub fn start_watching(app: AppHandle, root: String) -> Result<(), String> {
    let (tx, rx) = channel();
    let mut watcher = RecommendedWatcher::new(tx, Config::default())
        .map_err(|e| e.to_string())?;
    watcher.watch(Path::new(&root), RecursiveMode::Recursive)
        .map_err(|e| e.to_string())?;

    std::thread::spawn(move || {
        for event in rx {
            if let Ok(event) = event {
                let paths: Vec<String> = event.paths.iter()
                    .filter(|p| p.to_string_lossy().ends_with(".skill.md"))
                    .map(|p| p.to_string_lossy().to_string())
                    .collect();
                if !paths.is_empty() {
                    let _ = app.emit("skill-changed", paths);
                }
            }
        }
    });

    *WATCHER_STATE.lock().unwrap() = Some(watcher);
    Ok(())
}

#[tauri::command]
pub fn stop_watching() -> Result<(), String> {
    *WATCHER_STATE.lock().unwrap() = None;
    Ok(())
}
```

### 8. Frontend — App shell

`apps/desktop/src/App.tsx` (sketch):

```tsx
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { listen } from "@tauri-apps/api/event";
import { parseSkillString, compileSkill, lintSkill } from "@crosskill/core";
import Editor from "@monaco-editor/react";

interface SkillFile { path: string; content: string; }
interface Workspace { root: string; skills: SkillFile[]; }

export default function App() {
  const [ws, setWs] = useState<Workspace | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [watch, setWatch] = useState(false);
  const [status, setStatus] = useState("Ready");

  async function openWorkspace() {
    const root = await open({ directory: true, multiple: false });
    if (typeof root !== "string") return;
    const w = await invoke<Workspace>("open_workspace", { root });
    setWs(w);
    if (w.skills[0]) {
      setActive(w.skills[0].path);
      setContent(w.skills[0].content);
    }
  }

  async function save() {
    if (!ws || !active) return;
    try {
      const skill = parseSkillString(content);
      const results = compileSkill(skill, "");
      const outputs = results.map((r) => ({
        path: r.outputPath.replace(/^[/\\]+/, "").replace(/\\/g, "/"),
        content: r.content,
      }));
      // Also save the source skill back
      outputs.push({ path: active, content });
      const n = await invoke<number>("write_outputs", { root: ws.root, outputs });
      setStatus(`✓ Saved ${n} file(s)`);
    } catch (e) {
      setStatus(`⨯ ${(e as Error).message.split("\n")[0]}`);
    }
  }

  // Cmd/Ctrl+S → save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  useEffect(() => {
    if (!ws || !watch) return;
    const setup = async () => {
      await invoke("start_watching", { root: ws.root });
      const unlisten = await listen<string[]>("skill-changed", () => {
        // Re-read workspace
        invoke<Workspace>("open_workspace", { root: ws.root }).then(setWs);
      });
      return unlisten;
    };
    const p = setup();
    return () => {
      p.then((u) => u());
      invoke("stop_watching");
    };
  }, [ws, watch]);

  // ... render: sidebar with skills + editor + outputs panel
  // Reuse most of apps/web/app/page.tsx layout
}
```

### 9. Vite config

`apps/desktop/vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  build: {
    target: ["es2021", "chrome105", "safari14"],
    minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
});
```

### 10. Icons

Generate from a 1024x1024 source:

```bash
cd apps/desktop
bun run tauri icon path/to/source-1024.png
```

Tauri writes `icons/icon.ico`, `icon.icns`, `32x32.png`, `128x128.png`, etc.

For a quick start, Aziz can use his crosskill orange logo. Square, no padding, transparent background.

### 11. Local run

```bash
cd apps/desktop
bun run tauri:dev
```

Tauri launches the app window. First build takes ~3 minutes (Rust). Subsequent dev runs are ~5 seconds.

### 12. First production build

```bash
bun run tauri:build
```

Produces:
- Windows: `apps/desktop/src-tauri/target/release/bundle/msi/crosskill_0.4.0_x64_en-US.msi`
- Cross-builds happen in CI, not locally.

### 13. GitHub Actions release workflow

`.github/workflows/release.yml`:

```yaml
name: release

on:
  push:
    tags: ["v*"]

jobs:
  build-desktop:
    permissions:
      contents: write
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: macos-latest
            args: --target universal-apple-darwin
          - platform: ubuntu-22.04
            args: ""
          - platform: windows-latest
            args: ""
    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with: { node-version: 20 }

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with: { bun-version: latest }

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.platform == 'macos-latest' && 'aarch64-apple-darwin,x86_64-apple-darwin' || '' }}

      - name: Install Linux deps
        if: matrix.platform == 'ubuntu-22.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf

      - run: bun install
      - run: bun run --filter '@crosskill/core' build

      - uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
        with:
          projectPath: apps/desktop
          tagName: ${{ github.ref_name }}
          releaseName: "crosskill ${{ github.ref_name }}"
          releaseBody: "See CHANGELOG.md"
          releaseDraft: false
          prerelease: false
          args: ${{ matrix.args }}
```

### 14. Generate Tauri update keypair

One-time, locally:

```bash
cd apps/desktop
bun run tauri signer generate -w ~/.tauri/crosskill.key
```

Adds two secrets to GitHub repo:
- `TAURI_SIGNING_PRIVATE_KEY` — contents of the generated key file
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` — the password you set

Paste the public key into `tauri.conf.json` `plugins.updater.pubkey`.

### 15. Code signing

**Windows:** Defer for v0.4.0. Users get a SmartScreen warning. Document in README how to bypass. Later, buy an EV code-signing certificate (~$300/yr) and add to CI.

**macOS:** Defer Apple Developer Program ($99/yr) for v0.4.0. Users get "unidentified developer" warning. Document right-click → Open workaround.

**Linux:** No signing needed.

Add a section to the README:

```md
## Desktop app: first-run warnings

- **Windows:** SmartScreen may warn "Windows protected your PC". Click "More info" → "Run anyway". We'll sign builds in a future release.
- **macOS:** "App can't be opened because Apple cannot check it for malicious software". Right-click the app → Open → Open. We're working on notarization.
- **Linux:** No warning. `chmod +x` the AppImage if it isn't executable.
```

### 16. crosskill.app landing page

A simple one-page site under `apps/web/app/download/page.tsx` (or a separate site if you bought `crosskill.app`):

```tsx
export default function Download() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-bold mb-2">crosskill for desktop</h1>
      <p className="text-[var(--color-text-dim)] mb-8">Open a folder, edit a skill, every tool gets updated.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
        <DownloadCard os="Windows" href="https://github.com/alkhunizan/crosskill/releases/latest" />
        <DownloadCard os="macOS"   href="https://github.com/alkhunizan/crosskill/releases/latest" />
        <DownloadCard os="Linux"   href="https://github.com/alkhunizan/crosskill/releases/latest" />
      </div>
    </main>
  );
}
```

### 17. Verify the release flow

```bash
# Bump versions
# packages/core/package.json: 0.4.0
# packages/cli/package.json:  0.4.0
# apps/desktop/package.json:  0.4.0
# apps/desktop/src-tauri/Cargo.toml: 0.4.0
# apps/desktop/src-tauri/tauri.conf.json: 0.4.0

git add -A
git commit -m "feat(desktop): Tauri 2 native app for Windows, macOS, Linux

- Reuses @crosskill/core compiler
- Open workspace, browse skills, live compile preview
- Auto-save: edit a skill, every target file rewrites
- Watch mode: notify-based file watcher
- System tray integration
- GitHub Actions release pipeline for all three platforms
- Installers: .msi / .dmg / .AppImage"

git tag v0.4.0 -m "v0.4.0 — desktop app"
git push --tags
```

GitHub Actions picks up the tag, builds installers on three runners (~10–15 min total), and publishes them to the GitHub Release.

---

## Phase 3 acceptance checklist

- [ ] `bun run tauri:dev` opens a working desktop window locally on Windows
- [ ] Opening a folder lists all `*.skill.md` files
- [ ] Editing a skill + Ctrl+S writes all 7 outputs to the workspace folder
- [ ] Watch mode detects external changes and reloads the workspace
- [ ] System tray icon present, tooltip says "crosskill"
- [ ] GitHub release `v0.4.0` has 3 installer attachments
- [ ] Each installer launches the app on its platform
- [ ] Auto-updater config in place (will only verify in v0.5.0 release)
- [ ] crosskill.dev `/download` page lists the three downloads
- [ ] README updated with desktop install instructions + warning workarounds

---

## Risks & gotchas

1. **WebView2 issues on Windows.** Tauri 2 needs WebView2 ≥ 99. Pre-installed on Windows 10/11 since 2022. If users on older Windows 10 hit this, document the WebView2 runtime installer link.

2. **Rust build time.** First `cargo build` is ~3 minutes. Use `sccache` if you iterate a lot.

3. **macOS notarization.** Required for Mac users to open without warning. Apple Developer Program is $99/yr. Defer until v0.5+ unless Aziz wants to pay now.

4. **Path-traversal vulnerability.** The `write_outputs` Rust command MUST refuse to write outside `root_path`. The check above does this. Don't remove it.

5. **Workspaces and Tauri.** Tauri's build doesn't natively understand Bun workspaces. The workaround in CI is `bun run --filter '@crosskill/core' build` BEFORE `tauri-action`. Verify this works on first dry run.

6. **AppImage on Linux.** Some distros need `--no-sandbox` env var for newer Chromium-based WebKit. Test on Ubuntu 22.04 LTS at minimum.

7. **Auto-updater on first install.** It will only kick in for v0.5+ (current installed version must support the manifest format). Document this.

---

## What's next

Phase 4: launch polish. See `PLAN/05_PHASE4_LAUNCH.md`.
