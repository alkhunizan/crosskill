import { parseRef, type ResolvedSkill, type SkillResolver } from "./resolver.js";

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

/**
 * Build the candidate raw-content URLs we'll try for a GitHub-hosted skill.
 *
 * Strategy: if an explicit path was given in the ref, only that.
 * Otherwise try `skill.md` first (folder-convention name used by our own
 * starter skills), then `<repo>.skill.md` (single-skill-per-repo convention).
 *
 * Ref defaults to `HEAD` so users don't need to know whether the repo's
 * default branch is `main`, `master`, or something else.
 */
export function buildCandidateUrls(
  user: string,
  repo: string,
  ref: string | undefined,
  path: string | undefined
): string[] {
  const branch = ref ?? "HEAD";
  const base = `https://raw.githubusercontent.com/${user}/${repo}/${branch}`;
  if (path) return [`${base}/${path}`];
  return [`${base}/skill.md`, `${base}/${repo}.skill.md`];
}

/**
 * GitHub-as-registry resolver. Fetches a skill's raw markdown from
 * raw.githubusercontent.com over plain HTTPS. No GitHub auth needed for
 * public repos.
 */
export function createGithubResolver(fetchImpl: FetchLike = globalThis.fetch): SkillResolver {
  return {
    name: "github",
    canResolve(ref) {
      return parseRef(ref)?.kind === "github";
    },
    async resolve(ref) {
      const parsed = parseRef(ref);
      if (parsed?.kind !== "github") {
        throw new Error(`github resolver: not a github ref: ${ref}`);
      }
      const urls = buildCandidateUrls(parsed.user, parsed.repo, parsed.ref, parsed.path);
      const errors: string[] = [];
      for (const url of urls) {
        let res: Response;
        try {
          res = await fetchImpl(url);
        } catch (err) {
          errors.push(`${url} — network error: ${(err as Error).message}`);
          continue;
        }
        if (res.ok) {
          const content = await res.text();
          const refLabel = parsed.ref ? `@${parsed.ref}` : "";
          return {
            content,
            source: `github: ${parsed.user}/${parsed.repo}${refLabel}`,
          } satisfies ResolvedSkill;
        }
        errors.push(`${url} — HTTP ${res.status}`);
      }
      throw new Error(
        `Skill not found on GitHub for "${ref}". Tried:\n  ${errors.join("\n  ")}`
      );
    },
  };
}
