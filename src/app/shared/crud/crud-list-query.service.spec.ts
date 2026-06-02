import { describe, expect, it } from 'vitest';
import { shouldShowCrudEmptyState } from './crud-list-state';

describe('shouldShowCrudEmptyState', () => {
  it('shows the empty state only when the backend total is empty', () => {
    expect(shouldShowCrudEmptyState(0, 0)).toBe(true);
  });

  it('keeps the table visible when the current page is empty but matching rows exist', () => {
    expect(shouldShowCrudEmptyState(0, 12)).toBe(false);
  });

  it('keeps the table visible when the current page has rows', () => {
    expect(shouldShowCrudEmptyState(10, 12)).toBe(false);
  });
});
