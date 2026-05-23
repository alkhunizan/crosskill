"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Github,
  Download,
  Share2,
  BookOpen,
  FileText,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";
import {
  parseSkillString,
  compileSkillAll,
  lintSkill,
  SkillParseError,
  type CompileResult,
  type LintIssue,
} from "@crosskill/core";
import { downloadZip } from "@/app/lib/zip-output";
import { encodeShareUrl, decodeShareUrl } from "@/app/lib/share-url";
import { STARTER_SKILLS, getStarterSkillSource } from "@/app/lib/starters";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center text-[var(--color-text-faint)] text-sm">
      Loading editor…
    </div>
  ),
});

const DEFAULT_SKILL = `---
name: code-reviewer
version: 0.1.0
description: Structured code review with bugs / performance / style sections
tags: [code-review, quality]
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
  skillName: "skill",
};

export default function Playground() {
  const [source, setSource] = useState(DEFAULT_SKILL);
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Hydrate from `#s=...` if present.
  useEffect(() => {
    const fromHash = decodeShareUrl(window.location.hash);
    if (fromHash) setSource(fromHash);
  }, []);

  // Debounce so parse/compile doesn't fire on every keystroke.
  const [debouncedSource, setDebouncedSource] = useState(source);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSource(source), 150);
    return () => clearTimeout(t);
  }, [source]);

  const parsed: ParseState = useMemo(() => {
    try {
      const skill = parseSkillString(debouncedSource);
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
  }, [debouncedSource]);

  const { results, issues, error, skillName } = parsed;

  useEffect(() => {
    if (activeTab >= results.length) setActiveTab(0);
  }, [results.length, activeTab]);

  const active = results[activeTab];

  async function loadStarter(name: string) {
    if (!name) return;
    const text = await getStarterSkillSource(name);
    if (text) setSource(text);
  }

  function shareLink() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}${window.location.pathname}${encodeShareUrl(source)}`;
    navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 1500);
  }

  function copyOutput() {
    if (!active) return;
    navigator.clipboard.writeText(active.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--color-border)] flex items-center justify-between px-6 py-3 bg-[var(--color-bg-elev)]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-sm bg-[var(--color-accent)]" aria-hidden />
          <h1 className="text-base font-semibold tracking-tight">crosskill</h1>
          <span className="text-[var(--color-text-faint)] text-sm hidden sm:inline">
            one skill, every tool
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <a
            href="https://github.com/alkhunizan/crosskill/blob/main/docs/format.md"
            className="flex items-center gap-1.5 text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors"
          >
            <BookOpen size={14} /> Docs
          </a>
          <a
            href="https://github.com/alkhunizan/crosskill"
            className="flex items-center gap-1.5 text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors"
          >
            <Github size={14} /> GitHub
          </a>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-px bg-[var(--color-border)] min-h-0">
        {/* LEFT — Editor */}
        <section className="bg-[var(--color-bg)] flex flex-col min-h-0">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-bg-elev)]">
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-dim)]">
              <FileText size={14} />
              <span className="font-mono text-xs">{skillName}.skill.md</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  void loadStarter(e.target.value);
                  e.target.value = "";
                }}
                className="bg-[var(--color-bg-elev-2)] border border-[var(--color-border)] rounded px-2 py-1 text-xs text-[var(--color-text-dim)] hover:text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                defaultValue=""
                aria-label="Load starter skill"
              >
                <option value="" disabled>
                  Load starter…
                </option>
                {STARTER_SKILLS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                onClick={shareLink}
                className="flex items-center gap-1.5 text-xs bg-[var(--color-bg-elev-2)] hover:bg-[var(--color-border)] border border-[var(--color-border)] rounded px-2 py-1 text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors"
              >
                {shareCopied ? <Check size={12} /> : <Share2 size={12} />}
                {shareCopied ? "Copied" : "Share"}
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0">
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
                renderWhitespace: "selection",
              }}
            />
          </div>
          <div className="border-t border-[var(--color-border)] px-4 py-2 text-xs flex items-center gap-3 bg-[var(--color-bg-elev)]">
            {error ? (
              <span className="text-[var(--color-error)] truncate" title={error}>
                ⨯ {error.split("\n")[0]}
              </span>
            ) : (
              <>
                <span className="text-[var(--color-success)]">✓ Parsed</span>
                <span className="text-[var(--color-text-faint)]">
                  {issues.length === 0
                    ? "Lint clean"
                    : `${issues.length} lint note(s)`}
                </span>
                <span className="text-[var(--color-text-faint)]">
                  Compiled to {results.length} target(s)
                </span>
              </>
            )}
          </div>
        </section>

        {/* RIGHT — Outputs */}
        <section className="bg-[var(--color-bg)] flex flex-col min-h-0">
          <div className="flex items-stretch border-b border-[var(--color-border)] bg-[var(--color-bg-elev)]">
            <div className="flex items-center overflow-x-auto flex-1 min-w-0">
              {results.map((r, i) => (
                <button
                  key={r.target + i}
                  onClick={() => setActiveTab(i)}
                  className={`px-3 py-2 text-xs whitespace-nowrap border-r border-[var(--color-border)] transition-colors ${
                    i === activeTab
                      ? "bg-[var(--color-bg)] text-[var(--color-text)]"
                      : "text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
                  }`}
                >
                  {r.target}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 px-3 py-2 shrink-0">
              <button
                onClick={copyOutput}
                disabled={!active}
                className="flex items-center gap-1.5 text-xs text-[var(--color-text-dim)] hover:text-[var(--color-text)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={() => downloadZip(results, `crosskill-${skillName}`)}
                disabled={results.length === 0}
                className="flex items-center gap-1.5 text-xs bg-[var(--color-accent)] text-[var(--color-bg)] hover:opacity-90 rounded px-3 py-1 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                <Download size={12} /> Download ZIP
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto min-h-0">
            {active ? (
              <pre className="p-4 text-xs font-mono whitespace-pre-wrap break-words text-[var(--color-text)] m-0">
                <div className="text-[var(--color-text-faint)] mb-3 text-[10px] uppercase tracking-wider">
                  {active.outputPath.replace(/\\/g, "/")}
                </div>
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

      <footer className="border-t border-[var(--color-border)] px-6 py-3 text-xs text-[var(--color-text-faint)] flex items-center justify-between bg-[var(--color-bg-elev)]">
        <span>
          MIT · open source · runs entirely in your browser · zero telemetry
        </span>
        <span>
          built by{" "}
          <a
            href="https://azizme.com"
            className="text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors"
          >
            aziz
          </a>
        </span>
      </footer>
    </main>
  );
}
