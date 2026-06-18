import { describe, expect, it } from 'vitest';
import { defaultMatchAmountForJournalSelection } from './journal-assign-table.util';

describe('defaultMatchAmountForJournalSelection', () => {
  it('uses the journal amount when it is less than the available bank transaction amount', () => {
    expect(defaultMatchAmountForJournalSelection('', 75, 100, 0)).toBe('75.00');
  });

  it('uses the available bank transaction amount when the journal amount is greater', () => {
    expect(defaultMatchAmountForJournalSelection('', 150, 100, 0)).toBe('100.00');
  });

  it('uses the remaining amount after existing assignments', () => {
    expect(defaultMatchAmountForJournalSelection('', 150, 40, 0)).toBe('40.00');
  });

  it('uses the running remaining amount after already-selected journals', () => {
    expect(defaultMatchAmountForJournalSelection('', 90, 100, 30)).toBe('70.00');
  });

  it('does not overwrite a valid amount already entered for the journal', () => {
    expect(defaultMatchAmountForJournalSelection('42.00', 90, 100, 0)).toBeNull();
  });
});
