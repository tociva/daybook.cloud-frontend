import { Injectable, inject } from '@angular/core';
import { toIsoDate } from '../../../../../../core/date/dayjs-date.utils';
import { FiscalYearDateRangeService } from '../../../../../../shared/fiscal-year-date-range-picker/fiscal-year-date-range.service';
import type { BankTxn } from '../../../data/bank-txn';
import { LedgerStore } from '../../../data/ledger';
import type { JournalCreateSnapshot } from './journal-draft.store';
import { newJournalLineRow } from './journal-draft.store';

@Injectable({ providedIn: 'root' })
export class JournalCreateDraftStagingService {
  private readonly fiscalYearDateRange = inject(FiscalYearDateRangeService);
  private readonly ledgerStore = inject(LedgerStore);

  private snapshot: JournalCreateSnapshot | null = null;

  async stageFromBankTxn(txn: BankTxn): Promise<void> {
    this.snapshot = await this.buildSnapshotFromBankTxn(txn);
  }

  consume(): JournalCreateSnapshot | null {
    const snapshot = this.snapshot;
    this.snapshot = null;
    return snapshot;
  }

  clear(): void {
    this.snapshot = null;
  }

  private async buildSnapshotFromBankTxn(txn: BankTxn): Promise<JournalCreateSnapshot> {
    const defaultDate = this.fiscalYearDateRange.defaultDate();
    const ledgerId = txn.inventoryledgermap?.ledgerid ?? '';
    const debit = Number(txn.debit ?? 0);
    const credit = Number(txn.credit ?? 0);
    const amount = debit > 0 ? debit : credit;
    const amountStr = amount > 0 ? String(amount) : '';

    if (ledgerId) {
      await this.ledgerStore.loadLedgers({
        where: { id: { inq: [ledgerId] } },
        limit: 1,
        includes: ['category'],
      });
    }

    const ledgerDefaultOptions = this.ledgerStore.items();
    const ledger = ledgerDefaultOptions.find((item) => item.id === ledgerId);

    return {
      autoNumbering: true,
      journalDateModel: toIsoDate(txn.txndate, defaultDate),
      journalNumber: '',
      journalDescription: txn.description?.trim() || txn.bankref?.trim() || '',
      ledgerDefaultOptions,
      rows: [
        {
          uid: crypto.randomUUID(),
          ledgerId,
          ledgerName: ledger?.name ?? '',
          debit: debit > 0 ? amountStr : '',
          credit: credit > 0 ? amountStr : '',
        },
        {
          uid: crypto.randomUUID(),
          ledgerId: '',
          ledgerName: '',
          debit: credit > 0 ? amountStr : '',
          credit: debit > 0 ? amountStr : '',
        },
      ],
    };
  }
}
