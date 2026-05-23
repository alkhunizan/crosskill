import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { open } from "@tauri-apps/plugin-dialog";
import Editor, { type OnMount } from "@monaco-editor/react";
import {
  FolderOpen,
  FileText,
  Save,
  Eye,
  EyeOff,
  Github,
  Sparkles,
  Plus,
  FilePlus,
} from "lucide-react";
import {
  parseSkillString,
  compileSkillAll,
  lintSkill,
  SkillParseError,
  type CompileResult,
  type LintIssue,
} from "@crosskill/core";

interface SkillFile {
  path: string;
  content: string;
}

interface Workspace {
  root: string;
  skills: SkillFile[];
}

interface StandaloneSkill {
  path: string;
  content: string;
}

interface ParseState {
  results: CompileResult[];
  issues: LintIssue[];
  error: string | null;
  skillName: string;
}

const EMPTY_STATE: ParseState = {
  results: [],
  issues: [],
  error: null,
  skillName: "",
};

const KEBAB = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

function splitPath(p: string): { dir: string; name: string } {
  const i = Math.max(p.lastIndexOf("/"), p.lastIndexOf("\\"));
  if (i < 0) return { dir: ".", name: p };
  return { dir: p.slice(0, i), name: p.slice(i + 1) };
}

export default function App() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [dirty, setDirty] = useState(false);
  const [watching, setWatching] = useState(false);
  const [status, setStatus] = useState<{ text: string; tone: "ok" | "err" | "warn" | "muted" }>({
    text: "Open a folder, drag a file in, or create a new skill.",
    tone: "muted",
  });
  const [activeTab, setActiveTab] = useState(0);

  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const watchUnlistenRef = useRef<UnlistenFn | null>(null);
  const dropUnlistenRef = useRef<UnlistenFn | null>(null);

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  async function openWorkspace() {
    const selected = await open({ directory: true, multiple: false });
    if (typeof selected !== "string") return;
    await loadWorkspace(selected);
  }

  async function loadWorkspace(root: string) {
    try {
      const ws = await invoke<Workspace>("open_workspace", { root });
      setWorkspace(ws);
      if (ws.skills.length > 0) {
        const first = ws.skills[0]!;
        setActivePath(first.path);
        setContent(first.content);
        setStatus({
          text: `Opened ${ws.root} · ${ws.skills.length} skill(s).`,
          tone: "ok",
        });
      } else {
        setActivePath(null);
        setContent("");
        setStatus({
          text: `Opened ${ws.root} · no skill files yet — click + to add one.`,
          tone: "warn",
        });
      }
      setDirty(false);
    } catch (err) {
      setStatus({
        text: `⨯ ${(err as Error).message ?? String(err)}`,
        tone: "err",
      });
    }
  }

  async function openSingleFile() {
    const selected = await open({
      multiple: false,
      filters: [{ name: "Skill files", extensions: ["md"] }],
    });
    if (typeof selected !== "string") return;
    await loadSingleFile(selected);
  }

  async function loadSingleFile(filePath: string) {
    try {
      const standalone = await invoke<StandaloneSkill>("open_single_file", { path: filePath });
      // Treat the file's parent dir as a workspace-of-one so save still works.
      const { dir, name } = splitPath(standalone.path);
      setWorkspace({
        root: dir,
        skills: [{ path: name, content: standalone.content }],
      });
      setActivePath(name);
      setContent(standalone.content);
      setStatus({ text: `Loaded ${standalone.path}.`, tone: "ok" });
      setDirty(false);
    } catch (err) {
      setStatus({
        text: `⨯ ${(err as Error).message ?? String(err)}`,
        tone: "err",
      });
    }
  }

  async function newSkill() {
    if (!workspace) {
      setStatus({
        text: "Open a folder first — the new skill needs somewhere to live.",
        tone: "warn",
      });
      return;
    }
    // Native window.prompt is blocked in Tauri 2 webviews. Use a one-line
    // input dialog with the document selection trick: append an input, focus
    // it, and resolve when the user presses Enter or blurs it.
    const name = await promptInline({
      title: "New skill",
      label: "Skill name (kebab-case, e.g. my-skill):",
      placeholder: "my-skill",
      validate: (v) =>
        KEBAB.test(v) || "Use lowercase letters, digits, and hyphens. Min 2 chars.",
    });
    if (!name) return;
    try {
      const rel = await invoke<string>("create_skill", { root: workspace.root, name });
      // Re-scan so the new file shows in the sidebar.
      const ws = await invoke<Workspace>("open_workspace", { root: workspace.root });
      setWorkspace(ws);
      const created = ws.skills.find((s) => s.path === rel) ?? ws.skills[0];
      if (created) {
        setActivePath(created.path);
        setContent(created.content);
      }
      setStatus({ text: `Created ${rel}.`, tone: "ok" });
      setDirty(false);
    } catch (err) {
      setStatus({
        text: `⨯ ${(err as Error).message ?? String(err)}`,
        tone: "err",
      });
    }
  }

  function pickSkill(path: string) {
    if (!workspace) return;
    const found = workspace.skills.find((s) => s.path === path);
    if (!found) return;
    setActivePath(path);
    setContent(found.content);
    setDirty(false);
  }

  const parsed: ParseState = useMemo(() => {
    if (!content) return EMPTY_STATE;
    try {
      const skill = parseSkillString(content);
      return {
        results: compileSkillAll(skill, ""),
        issues: lintSkill(skill),
        error: null,
        skillName: skill.frontmatter.name,
      };
    } catch (err: unknown) {
      const message =
        err instanceof SkillParseError
          ? err.message
          : err instanceof Error
          ? err.message
          : String(err);
      return { ...EMPTY_STATE, error: message };
    }
  }, [content]);

  useEffect(() => {
    if (activeTab >= parsed.results.length) setActiveTab(0);
  }, [parsed.results.length, activeTab]);

  const save = useCallback(async () => {
    if (!workspace || !activePath) return;
    try {
      const skill = parseSkillString(content);
      const results = compileSkillAll(skill, "");
      const outputs = results.map((r) => ({
        path: r.outputPath.replace(/^[/\\]+/, "").replace(/\\/g, "/"),
        content: r.content,
      }));
      outputs.push({ path: activePath, content });
      const n = await invoke<number>("write_outputs", {
        root: workspace.root,
        outputs,
      });
      setStatus({ text: `✓ Saved ${n} file(s).`, tone: "ok" });
      setDirty(false);
      setWorkspace((ws) =>
        ws
          ? {
              ...ws,
              skills: ws.skills.map((s) =>
                s.path === activePath ? { ...s, content } : s
              ),
            }
          : ws
      );
    } catch (err) {
      const message =
        err instanceof SkillParseError
          ? err.message.split("\n")[0]
          : (err as Error).message ?? String(err);
      setStatus({ text: `⨯ ${message}`, tone: "err" });
    }
  }, [workspace, activePath, content]);

  // Cmd/Ctrl+S keyboard shortcut.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [save]);

  // Native Tauri drag-and-drop: any file the OS hands us gets opened.
  // The webview's HTML5 dnd is hijacked by Tauri on Windows, so we use the
  // webview's `onDragDropEvent` instead.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const wv = getCurrentWebview();
      const unlisten = await wv.onDragDropEvent(async (e) => {
        if (cancelled) return;
        if (e.payload.type !== "drop") return;
        const paths = e.payload.paths;
        if (!paths || paths.length === 0) return;
        // Pick the first .md file dropped; ignore non-skill files.
        const first = paths.find((p) =>
          p.toLowerCase().endsWith(".md")
        );
        if (!first) {
          setStatus({
            text: "⨯ Drop a .md / .skill.md file (any folder will also work).",
            tone: "err",
          });
          return;
        }
        await loadSingleFile(first);
      });
      dropUnlistenRef.current = unlisten;
    })();
    return () => {
      cancelled = true;
      if (dropUnlistenRef.current) dropUnlistenRef.current();
      dropUnlistenRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!workspace) return;
    let cancelled = false;

    if (watching) {
      (async () => {
        try {
          await invoke("start_watching", { root: workspace.root });
          watchUnlistenRef.current = await listen<string[]>("skill-changed", () => {
            if (cancelled || !workspace) return;
            void invoke<Workspace>("open_workspace", { root: workspace.root })
              .then((ws) => {
                if (cancelled) return;
                setWorkspace(ws);
                if (
                  activePath &&
                  !ws.skills.some((s) => s.path === activePath) &&
                  ws.skills[0]
                ) {
                  setActivePath(ws.skills[0].path);
                  setContent(ws.skills[0].content);
                  setDirty(false);
                }
              })
              .catch(() => {});
          });
        } catch (err) {
          setStatus({
            text: `⨯ Watcher failed: ${(err as Error).message ?? String(err)}`,
            tone: "err",
          });
        }
      })();
    }

    return () => {
      cancelled = true;
      if (watchUnlistenRef.current) {
        watchUnlistenRef.current();
        watchUnlistenRef.current = null;
      }
      void invoke("stop_watching").catch(() => {});
    };
  }, [watching, workspace, activePath]);

  const active = parsed.results[activeTab];
  const skillLabel =
    parsed.skillName ||
    activePath?.replace(/\.skill\.md$/, "").split("/").pop() ||
    "skill";

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-left">
          <div className="app-logo" aria-hidden />
          <div className="app-title">crosskill</div>
          <div className="app-subtitle">desktop · v0.4.3</div>
        </div>
        <div className="app-header-right">
          <button
            className="btn btn-secondary"
            onClick={openWorkspace}
            title="Open a folder of skills"
          >
            <FolderOpen size={12} /> Open folder
          </button>
          <button
            className="btn btn-secondary"
            onClick={openSingleFile}
            title="Open a single .md skill file"
          >
            <FileText size={12} /> Open file…
          </button>
          <button
            className="btn btn-secondary"
            onClick={newSkill}
            disabled={!workspace}
            title="Add a new skill to the open workspace"
          >
            <Plus size={12} /> New skill
          </button>
          <label
            className="watch-toggle"
            title={workspace ? "Auto-reload when files change" : "Open a folder first"}
          >
            <input
              type="checkbox"
              checked={watching}
              onChange={(e) => setWatching(e.target.checked)}
              disabled={!workspace}
            />
            {watching ? <Eye size={12} /> : <EyeOff size={12} />}
            Watch
          </label>
          <button
            className="btn btn-primary"
            onClick={save}
            disabled={!activePath || !!parsed.error}
            title="Save (Ctrl/Cmd+S)"
          >
            <Save size={12} /> Save
          </button>
          <a
            href="https://github.com/alkhunizan/crosskill"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{ textDecoration: "none" }}
          >
            <Github size={12} /> GitHub
          </a>
        </div>
      </header>

      <aside className="app-sidebar">
        <div className="sidebar-section">Workspace</div>
        {workspace ? (
          <>
            <div className="sidebar-root" title={workspace.root}>
              {splitPath(workspace.root).name}
            </div>
            {workspace.skills.length === 0 ? (
              <div className="sidebar-empty">
                No skill files here yet.
                <br />
                <br />
                Click <strong>+ New skill</strong> to add one, drop a{" "}
                <code>.md</code> file onto the window, or toggle{" "}
                <em>Watch</em> and create the file in your editor.
              </div>
            ) : (
              workspace.skills.map((s) => (
                <button
                  key={s.path}
                  className={`sidebar-item ${s.path === activePath ? "active" : ""}`}
                  onClick={() => pickSkill(s.path)}
                  title={s.path}
                >
                  {s.path.split("/").pop()}
                </button>
              ))
            )}
          </>
        ) : (
          <div className="sidebar-empty">
            Get started:
            <ul className="sidebar-tips">
              <li>
                <FolderOpen size={11} /> <strong>Open folder</strong> — pick a
                repo with <code>.skill.md</code> files.
              </li>
              <li>
                <FileText size={11} /> <strong>Open file…</strong> — load one{" "}
                <code>.md</code> skill.
              </li>
              <li>
                <FilePlus size={11} /> Drop a <code>.md</code> file onto this
                window.
              </li>
            </ul>
          </div>
        )}
      </aside>

      <main className="main">
        <section className="editor-pane">
          <div className="pane-header">
            <div className="pane-title">
              <FileText size={12} />
              <span>
                {activePath ?? "no file"}
                {dirty ? " ·" : ""}
              </span>
            </div>
            <div className="pane-title">{skillLabel}</div>
          </div>
          <div className="editor-host">
            {activePath ? (
              <Editor
                defaultLanguage="markdown"
                theme="vs-dark"
                value={content}
                onMount={handleEditorMount}
                onChange={(v) => {
                  setContent(v ?? "");
                  setDirty(true);
                }}
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
            ) : (
              <div className="empty-state">
                <Sparkles size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
                Open a folder, pick a file, or drop one onto the window.
              </div>
            )}
          </div>
        </section>

        <section className="output-pane">
          <div className="tab-strip">
            {parsed.results.length === 0 ? (
              <div className="empty-state" style={{ minHeight: 32, padding: "8px 16px" }}>
                Outputs
              </div>
            ) : (
              parsed.results.map((r, i) => (
                <button
                  key={r.target + i}
                  className={`tab ${i === activeTab ? "active" : ""}`}
                  onClick={() => setActiveTab(i)}
                >
                  {r.target}
                </button>
              ))
            )}
          </div>
          <div className="output-body">
            {active ? (
              <>
                <div className="output-path">
                  {active.outputPath.replace(/\\/g, "/")}
                </div>
                {active.content}
              </>
            ) : parsed.error ? (
              <div className="empty-state status-error">
                <Sparkles size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
                Fix the skill source to see compiled outputs.
              </div>
            ) : activePath ? (
              <div className="empty-state">
                <Sparkles size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
                No enabled targets yet.
              </div>
            ) : (
              <div className="empty-state">
                <Sparkles size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
                Open a folder to see compiled outputs.
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="app-status">
        <div className="status-left">
          {parsed.error ? (
            <span className="status-error" title={parsed.error}>
              ⨯ {parsed.error.split("\n")[0]}
            </span>
          ) : activePath ? (
            <>
              <span className="status-success">✓ Parsed</span>
              <span>
                {parsed.issues.length === 0
                  ? "Lint clean"
                  : `${parsed.issues.length} lint note(s)`}
              </span>
              <span>Compiled to {parsed.results.length} target(s)</span>
              {dirty && <span className="status-warn">unsaved changes</span>}
            </>
          ) : null}
        </div>
        <div
          className={
            status.tone === "err"
              ? "status-error"
              : status.tone === "warn"
              ? "status-warn"
              : status.tone === "ok"
              ? "status-success"
              : ""
          }
        >
          {status.text}
        </div>
      </footer>
    </div>
  );
}

/**
 * Inline prompt — a small modal that replaces window.prompt (which the
 * Tauri webview won't show on Windows). Resolves to the entered value, or
 * null if the user dismissed it.
 */
function promptInline(opts: {
  title: string;
  label: string;
  placeholder?: string;
  validate?: (v: string) => true | string;
}): Promise<string | null> {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "prompt-overlay";
    overlay.innerHTML = `
      <div class="prompt-box">
        <div class="prompt-title">${opts.title}</div>
        <label class="prompt-label">${opts.label}</label>
        <input class="prompt-input" placeholder="${opts.placeholder ?? ""}" />
        <div class="prompt-error"></div>
        <div class="prompt-actions">
          <button class="btn btn-secondary" data-action="cancel">Cancel</button>
          <button class="btn btn-primary" data-action="ok">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    const input = overlay.querySelector<HTMLInputElement>(".prompt-input")!;
    const errorEl = overlay.querySelector<HTMLDivElement>(".prompt-error")!;
    const cancelBtn = overlay.querySelector<HTMLButtonElement>('[data-action="cancel"]')!;
    const okBtn = overlay.querySelector<HTMLButtonElement>('[data-action="ok"]')!;

    function cleanup(value: string | null) {
      document.body.removeChild(overlay);
      resolve(value);
    }
    function confirm() {
      const v = input.value.trim();
      if (opts.validate) {
        const r = opts.validate(v);
        if (r !== true) {
          errorEl.textContent = r;
          return;
        }
      }
      cleanup(v || null);
    }

    cancelBtn.addEventListener("click", () => cleanup(null));
    okBtn.addEventListener("click", confirm);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        confirm();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cleanup(null);
      }
    });

    // Focus next tick so the overlay is in the DOM.
    setTimeout(() => input.focus(), 0);
  });
}
