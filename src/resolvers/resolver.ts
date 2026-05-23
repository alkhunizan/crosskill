/**
 * SkillResolver — fetch a skill's raw source from somewhere. The shape is
 * shared by every resolver (local, github, future registry) so `add` can
 * dispatch without knowing the source.
 */
export interface ResolvedSkill {
  /** Raw `*.skill.md` markdown. */
  content: string;
  /** Human-readable provenance, e.g. `"local: code-reviewer"`, `"github: user/repo@abc1234"`. */
  source: string;
}

export interface SkillResolver {
  /** Lowercase name for log lines. */
  name: string;
  /** Can this resolver handle `ref`? Cheap synchronous check, no I/O. */
  canResolve(ref: string): boolean;
  /** Resolve `ref` to skill content. Throws on miss / network / format errors. */
  resolve(ref: string): Promise<ResolvedSkill>;
}

/**
 * Reference shapes accepted by `crosskill add`. Parsed once up front so each
 * resolver only sees structured input. Returning `null` means "not my shape" —
 * `canResolve()` should mirror this.
 */
export type ParsedRef =
  | { kind: "local"; name: string }
  | { kind: "registry"; scope: string; name: string }
  | { kind: "github"; user: string; repo: string; path?: string; ref?: string };

const KEBAB = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
const SCOPED = /^@([a-z0-9][a-z0-9-]*)\/([a-z0-9][a-z0-9-]*[a-z0-9])$/;
// user/repo, user/repo@ref, user/repo/path/to/file@ref
const GH = /^([A-Za-z0-9][A-Za-z0-9-]*)\/([A-Za-z0-9._-]+?)(?:\/([^@]+))?(?:@(.+))?$/;

export function parseRef(rawRef: string): ParsedRef | null {
  const ref = rawRef.trim();

  // Local (bundled starter): bare name or `@crosskill/<name>`
  if (KEBAB.test(ref)) return { kind: "local", name: ref };
  const crosskillScoped = ref.match(/^@crosskill\/([a-z0-9][a-z0-9-]*[a-z0-9])$/);
  if (crosskillScoped) return { kind: "local", name: crosskillScoped[1]! };

  // Future registry: any other `@scope/name`
  const scoped = ref.match(SCOPED);
  if (scoped) return { kind: "registry", scope: scoped[1]!, name: scoped[2]! };

  // GitHub: user/repo[/path][@ref]
  const gh = ref.match(GH);
  if (gh) {
    return {
      kind: "github",
      user: gh[1]!,
      repo: gh[2]!,
      path: gh[3],
      ref: gh[4],
    };
  }

  return null;
}
