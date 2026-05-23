import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
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

export default function App() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [dirty, setDirty] = useState(false);
  const [watching, setWatching] = useState(false);
  const [status, setStatus] = useState<{ text: string; tone: "ok" | "err" | "warn" | "muted" }>({
    text: "Open a folder to begin.",
    tone: "muted",
  });
  const [activeTab, setActiveTab] = useState(0);

  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const watchUnlistenRef = useRef<UnlistenFn | null>(null);

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  async function openWorkspace() {
    const selected = await open({ directory: true, multiple: false });
    if (typeof selected !== "string") return;
    try {
      const ws = await invoke<Workspace>("open_workspace", { root: selected });
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
          text: `Opened ${ws.root} · no .skill.md files yet.`,
          tone: "warn",
        });
      }
      setDirty(false);
    } catch (err) {
      setStatus({ text: `⨯ ${(err as Error).message ?? String(err)}`, tone: "err" });
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
        path: r.outputPath
          .replace(/^[/\\]+/, "")
          .replace(/\\/g, "/"),
        content: r.content,
      }));
      // Persist the source skill itself too — the user might have edited it.
      outputs.push({ path: activePath, content });
      const n = await invoke<number>("write_outputs", {
        root: workspace.root,
        outputs,
      });
      setStatus({ text: `✓ Saved ${n} file(s).`, tone: "ok" });
      setDirty(false);
      // Reflect the change in our in-memory workspace.
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

  // Watch toggle: start the Rust-side watcher and re-read the workspace when
  // an external editor changes a `*.skill.md` file.
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
                // If the active file moved/disappeared, jump to the first one.
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
  const skillLabel = parsed.skillName || activePath?.replace(/\.skill\.md$/, "").split("/").pop() || "skill";

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-left">
          <div className="app-logo" aria-hidden />
          <div className="app-title">crosskill</div>
          <div className="app-subtitle">desktop · v0.4.0</div>
        </div>
        <div className="app-header-right">
          <button className="btn btn-secondary" onClick={openWorkspace}>
            <FolderOpen size={12} /> Open folder
          </button>
          <label className="watch-toggle">
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
          workspace.skills.length === 0 ? (
            <div className="sidebar-empty">
              No <code>.skill.md</code> files found.
              <br />
              Drop one into the folder and toggle <em>Watch</em>.
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
          )
        ) : (
          <div className="sidebar-empty">
            Click <strong>Open folder</strong> to scan a repo for{" "}
            <code>.skill.md</code> files.
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
                Open a folder and pick a skill to edit.
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
                <div className="output-path">{active.outputPath.replace(/\\/g, "/")}</div>
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
          ) : (
            <span>{status.text}</span>
          )}
        </div>
        <div>
          <span>{status.text}</span>
        </div>
      </footer>
    </div>
  );
}
