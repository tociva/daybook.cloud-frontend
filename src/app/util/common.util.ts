export const toFlagEmoji = (code: string): string => {
  return code.toUpperCase().replace(/./g, c =>
    String.fromCodePoint(127397 + c.charCodeAt(0))
  );
}

export function buildFormKey(entity: string, mode: 'create' | 'edit', id?: string | null) {
  return id ? `${entity}:${mode}:${id}` : `${entity}:${mode}`;
}

// Keep: Letters (\p{L}), Combining marks (\p{M}), Numbers (\p{N}), spaces (\p{Zs})
// Remove: everything else (emoji, punctuation, symbols)
export function sanitizeQuery(input: string): string {
  return input
    .normalize('NFC')
    .replace(/[^\p{L}\p{M}\p{N}\p{Zs}]/gu, '') // strip specials
    .replace(/\s+/g, ' ')                       // collapse spaces
    .trim();
}


/** Multi-pass URL decoder for double/triple-encoded values. */
export function multiDecode(input: string | null | undefined, max = 5): string | null {
  if (!input) return null;
  let v = input;
  for (let i = 0; i < max; i++) {
    // stop if there’s nothing left to decode
    if (!/%[0-9A-Fa-f]{2}/.test(v)) break;
    try {
      v = decodeURIComponent(v);
    } catch {
      break; // malformed sequence; keep best-effort value
    }
  }
  return v;
}
