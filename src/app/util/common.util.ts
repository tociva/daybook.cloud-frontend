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
