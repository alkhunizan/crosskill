/**
 * EvalRunner — abstraction over "send a system+user prompt to an LLM,
 * get back text." Future runners (OpenAI-compatible HTTP, llama.cpp,
 * Anthropic) implement this same interface.
 */
export interface EvalRunner {
  /** Display name used in CLI output. */
  name: string;
  /**
   * Return null when the runner is not configured / unreachable. Callers
   * print a one-line skip message and move on. Do not throw for "not
   * available" — only throw for actual transport failures during a real
   * request.
   */
  ping(): Promise<{ ok: true } | { ok: false; reason: string }>;
  /**
   * Send a chat-style request and return the assistant's text reply.
   * Throws on network or HTTP errors.
   */
  complete(system: string, user: string): Promise<string>;
}
