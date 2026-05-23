import type { Compiler, SupportedTarget } from "../schema.js";
import { claudeCompiler } from "./claude.js";
import { cursorCompiler } from "./cursor.js";
import { codexCompiler } from "./agents-md.js";
import { windsurfCompiler } from "./windsurf.js";
import { aiderCompiler } from "./aider.js";
import { opencodeCompiler } from "./opencode.js";
import { geminiCompiler } from "./gemini.js";

export const COMPILERS: Record<SupportedTarget, Compiler | undefined> = {
  claude: claudeCompiler,
  cursor: cursorCompiler,
  codex: codexCompiler,
  windsurf: windsurfCompiler,
  aider: aiderCompiler,
  opencode: opencodeCompiler,
  gemini: geminiCompiler,
  copilot: undefined, // beta — placeholder
  continue: undefined, // beta — placeholder
};

export function getCompiler(target: SupportedTarget): Compiler | undefined {
  return COMPILERS[target];
}
