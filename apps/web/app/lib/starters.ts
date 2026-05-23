import { STARTER_SKILLS as STARTER_NAMES } from "@crosskill/skills";

/**
 * Starter skill loader.
 *
 * At build time `scripts/copy-starters.mjs` copies every `packages/skills/<n>/skill.md`
 * into `apps/web/public/skills/<n>.skill.md` so the static site can fetch
 * them without any backend. We expose the list (from `@crosskill/skills`) plus
 * a cached fetcher.
 */
export const STARTER_SKILLS = [...STARTER_NAMES] as readonly string[];

const cache = new Map<string, string>();

export async function getStarterSkillSource(name: string): Promise<string | null> {
  if (!STARTER_SKILLS.includes(name)) return null;
  const cached = cache.get(name);
  if (cached !== undefined) return cached;
  const res = await fetch(`/skills/${name}.skill.md`);
  if (!res.ok) return null;
  const text = await res.text();
  cache.set(name, text);
  return text;
}
