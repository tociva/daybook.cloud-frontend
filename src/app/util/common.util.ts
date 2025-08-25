export const toFlagEmoji = (code: string): string => {
  return code.toUpperCase().replace(/./g, c =>
    String.fromCodePoint(127397 + c.charCodeAt(0))
  );
}

export function buildFormKey(entity: string, mode: 'create' | 'edit', id?: string | null) {
  return id ? `${entity}:${mode}:${id}` : `${entity}:${mode}`;
}
