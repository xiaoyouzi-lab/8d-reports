// Unicode-aware slug for markdown headings and help categories.
//
// The marketing content library now carries Simplified Chinese articles. Keeping
// non-ASCII letters and digits means Chinese section titles still produce
// stable, non-empty anchor ids instead of collapsing to an empty string.
// English input is unchanged because the punctuation/space rules are the same.
export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
}
