export const willPassRequiredStringValidation = (value: string|undefined|null): boolean => {
  return value !== undefined && value !== null && value.trim() !== '';
}

export const willPassRequiredNumberValidation = (value: number|undefined|null): boolean => {
  return value !== undefined && value !== null && !isNaN(value);
}

export const willPassEmailValidation = (value: string|undefined|null): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value ?? '');
}

export const willPassMinLengthValidation = (value: string|undefined|null, minLength: number): boolean => {
  return (value ?? '').length >= minLength;
}

export const willPassMaxLengthValidation = (value: string|undefined|null, maxLength: number): boolean => {
  return (value ?? '').length <= maxLength;
}

export const willPassPatternValidation = (value: string|undefined|null, pattern: RegExp): boolean => {
  return pattern.test(value ?? '');
}