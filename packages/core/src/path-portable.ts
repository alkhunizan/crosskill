/**
 * Browser-safe path join.
 *
 * The compilers only ever need `join(root, "<relative-path>")` to compose
 * `outputPath` strings — they don't touch the filesystem themselves. Pulling
 * `node:path` in just for that bakes a `node:` URI into the bundle, which
 * Webpack 5 refuses to resolve. This implementation matches `path.posix.join`
 * semantics for the inputs the compilers actually pass (no `..` segments,
 * no Windows-drive prefixes), which is all we need.
 *
 * Behavior:
 *   join("a", "b/c")     → "a/b/c"
 *   join(".", "b")       → "b"
 *   join("", "b")        → "b"
 *   join("a/", "/b")     → "a/b"
 *   join("a", "b", "c")  → "a/b/c"
 *
 * If a compiler ever needs full `node:path` semantics (it shouldn't), it
 * should accept the path as a string instead of computing it.
 */
export function joinPath(...segments: string[]): string {
  const cleaned: string[] = [];
  let leadingSlash = false;
  for (let i = 0; i < segments.length; i++) {
    const raw = segments[i];
    if (!raw || raw === ".") continue;
    let seg = raw.replace(/\\/g, "/");
    // Preserve a leading "/" from the first non-empty segment (absolute roots
    // on POSIX, or test fixtures that pass "/repo").
    if (cleaned.length === 0 && seg.startsWith("/")) {
      leadingSlash = true;
    }
    seg = seg.replace(/^\/+/, "").replace(/\/+$/, "");
    if (seg === "") continue;
    cleaned.push(seg);
  }
  if (cleaned.length === 0) return leadingSlash ? "/" : ".";
  return (leadingSlash ? "/" : "") + cleaned.join("/");
}
