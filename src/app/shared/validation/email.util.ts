export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function validateEmail(value: string, submitted: boolean): string | null {
  if (!submitted) return null;

  const trimmed = value.trim();
  if (trimmed === '') return 'Email is required.';
  if (!EMAIL_PATTERN.test(trimmed)) return 'Invalid email address.';
  return null;
}
