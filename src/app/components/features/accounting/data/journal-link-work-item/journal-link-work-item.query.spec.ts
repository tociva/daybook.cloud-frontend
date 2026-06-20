import { convertToParamMap } from '@angular/router';
import { describe, expect, it } from 'vitest';
import {
  applyJournalLinkWorkItemSortChange,
  isJournalLinkWorkItemMode,
  parseJournalLinkWorkItemQuery,
} from './journal-link-work-item.query';

describe('journal link work item query utilities', () => {
  it('parses supported route params with defaults', () => {
    expect(
      parseJournalLinkWorkItemQuery(
        convertToParamMap({
          limit: '500',
          order: 'pendingAmount DESC',
          skip: '10',
          sourceType: 'purchase_invoice',
          status: 'partial',
        }),
      ),
    ).toEqual({
      limit: 200,
      order: 'pendingAmount DESC',
      skip: 10,
      sourceType: 'purchase_invoice',
      status: 'partial',
    });
  });

  it('falls back to source and status defaults for invalid params', () => {
    expect(
      parseJournalLinkWorkItemQuery(
        convertToParamMap({
          limit: '-1',
          order: 'unsupported ASC',
          skip: 'bad',
          sourceType: 'credit_note',
          status: 'bad',
        }),
        'receipt',
      ),
    ).toEqual({
      limit: 50,
      skip: 0,
      sourceType: 'receipt',
      status: 'not_fully_linked',
    });
  });

  it('detects source-specific work-item mode', () => {
    const params = convertToParamMap({ sourceType: 'contra' });

    expect(isJournalLinkWorkItemMode(params, 'contra')).toBe(true);
    expect(isJournalLinkWorkItemMode(params, 'bank_txn')).toBe(false);
  });

  it('applies supported table sort changes and resets pagination', () => {
    expect(
      applyJournalLinkWorkItemSortChange(
        {
          limit: 50,
          skip: 50,
          sourceType: 'sale_invoice',
          status: 'not_fully_linked',
        },
        { activeColumnId: 'pendingAmount', direction: 'desc' },
      ),
    ).toEqual({
      limit: 50,
      order: 'pendingAmount DESC',
      skip: 0,
      sourceType: 'sale_invoice',
      status: 'not_fully_linked',
    });
  });
});
