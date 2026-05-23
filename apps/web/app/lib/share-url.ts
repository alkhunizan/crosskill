import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";

/**
 * Hash-encoded share URLs.
 *
 * Skill source rides in the URL fragment so it never hits a server. lz-string
 * keeps the URL well under common 2k limits even for ~10 KB skills.
 */
export function encodeShareUrl(source: string): string {
  return `#s=${compressToEncodedURIComponent(source)}`;
}

export function decodeShareUrl(hash: string): string | null {
  if (!hash.startsWith("#s=")) return null;
  const decoded = decompressFromEncodedURIComponent(hash.slice(3));
  return decoded === "" ? null : decoded;
}
