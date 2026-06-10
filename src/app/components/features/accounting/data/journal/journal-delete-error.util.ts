import { getApiErrorMessage } from '../../../../../core/api/api-error.util';

export function journalDeleteErrorMessage(error: unknown): string {
  const message = getApiErrorMessage(error, 'Failed to delete journal.');
  if (/fk_reconciliationmatch_journalid|reconciliationmatch/i.test(message)) {
    return 'This journal cannot be deleted because it is linked to bank reconciliation records.';
  }
  return message;
}
