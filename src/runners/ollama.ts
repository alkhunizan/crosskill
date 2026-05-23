import type { EvalRunner } from "./runner.js";

/**
 * Ollama runner — talks to a local Ollama daemon over HTTP.
 *
 * Config via env (so CI and dev share the same shape):
 *   OLLAMA_URL   — base URL, default http://localhost:11434
 *   OLLAMA_MODEL — model tag, default llama3.2
 *
 * Uses the /api/chat endpoint with streaming disabled to keep the runner
 * trivial.
 */
export function createOllamaRunner(opts?: { url?: string; model?: string }): EvalRunner {
  const url = (opts?.url ?? process.env.OLLAMA_URL ?? "http://localhost:11434").replace(/\/$/, "");
  const model = opts?.model ?? process.env.OLLAMA_MODEL ?? "llama3.2";

  return {
    name: `ollama (${model} @ ${url})`,
    async ping() {
      try {
        const r = await fetch(`${url}/api/tags`, { method: "GET" });
        if (!r.ok) return { ok: false, reason: `HTTP ${r.status}` };
        return { ok: true };
      } catch (err) {
        return { ok: false, reason: (err as Error).message };
      }
    },
    async complete(system, user) {
      const res = await fetch(`${url}/api/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model,
          stream: false,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      });
      if (!res.ok) {
        throw new Error(`Ollama HTTP ${res.status}: ${await res.text()}`);
      }
      const body = (await res.json()) as { message?: { content?: string } };
      return body.message?.content ?? "";
    },
  };
}
