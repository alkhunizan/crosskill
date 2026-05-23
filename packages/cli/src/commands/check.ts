import { buildCommand } from "./build.js";

/**
 * `crosskill check` — verify outputs match `crosskill.lock` without writing.
 * Thin alias over `crosskill build --frozen` for discoverability in CI configs.
 */
export async function checkCommand(opts: { cwd?: string } = {}): Promise<void> {
  await buildCommand({ ...opts, frozen: true });
}
