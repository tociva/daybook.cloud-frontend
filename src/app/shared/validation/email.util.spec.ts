import { describe, expect, it } from 'vitest';
import { isValidEmail, validateEmail } from './email.util';

describe('email.util', () => {
  describe('isValidEmail', () => {
    it('accepts valid email addresses', () => {
      expect(isValidEmail('valid@example.com')).toBe(true);
      expect(isValidEmail('  valid@example.com  ')).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('not-an-email')).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('returns null before submit', () => {
      expect(validateEmail('', false)).toBeNull();
      expect(validateEmail('invalid', false)).toBeNull();
    });

    it('requires email after submit', () => {
      expect(validateEmail('', true)).toBe('Email is required.');
      expect(validateEmail('   ', true)).toBe('Email is required.');
    });

    it('rejects invalid email format after submit', () => {
      expect(validateEmail('not-an-email', true)).toBe('Invalid email address.');
    });

    it('accepts valid email after submit', () => {
      expect(validateEmail('valid@example.com', true)).toBeNull();
    });
  });
});
