import JSZip from "jszip";
import type { CompileResult } from "@crosskill/core";

/**
 * Bundle every compiled output into a single ZIP and trigger a browser
 * download. The zip layout mirrors what `crosskill build` writes to disk —
 * `.claude/skills/...`, `.cursor/rules/...`, `AGENTS.md`, etc. — so a user
 * can unzip into their repo and have the same tree they'd get from the CLI.
 */
export async function downloadZip(
  results: readonly CompileResult[],
  filename: string
): Promise<void> {
  if (results.length === 0) return;

  const zip = new JSZip();
  for (const r of results) {
    const path = r.outputPath
      .replace(/^[/\\]+/, "")
      .replace(/\\/g, "/");
    // Aggregated targets (AGENTS.md, copilot-instructions.md) can collide if
    // we ever support multiple skills. For the single-skill playground each
    // path is unique, but `file()` is idempotent in single-skill mode.
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
