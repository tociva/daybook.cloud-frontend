import { Injectable, inject } from '@angular/core';
import { toIsoDate } from '../../../../../../core/date/dayjs-date.utils';
import { FiscalYearDateRangeService } from '../../../../../../shared/fiscal-year-date-range-picker/fiscal-year-date-range.service';
import { formatAmountForInput, roundMoney } from '../../../data/bank-txn';
import type { BankTxn } from '../../../data/bank-txn';
import { InventoryLedgerMapStore } from '../../../data/inventory-ledger-map';
import { LedgerStore } from '../../../data/ledger';
import type { Ledger } from '../../../data/ledger';
import type { JournalCreateSnapshot } from './journal-draft.store';
import { newJournalLineRow } from './journal-draft.store';

@Injectable({ providedIn: 'root' })
export class JournalCreateDraftStagingService {
  private readonly fiscalYearDateRange = inject(FiscalYearDateRangeService);
  private readonly inventoryLedgerMapStore = inject(InventoryLedgerMapStore);
  private readonly ledgerStore = inject(LedgerStore);

  private snapshot: JournalCreateSnapshot | null = null;

  async stageFromBankTxn(
    txn: BankTxn,
    options?: Readonly<{ bankLedgerAmount?: number }>,
  ): Promise<void> {
    this.snapshot = await this.buildSnapshotFromBankTxn(txn, options);
  }

  consume(): JournalCreateSnapshot | null {
    const snapshot = this.snapshot;
    this.snapshot = null;
    return snapshot;
  }

  clear(): void {
    this.snapshot = null;
  }

  private async buildSnapshotFromBankTxn(
    txn: BankTxn,
    options?: Readonly<{ bankLedgerAmount?: number }>,
  ): Promise<JournalCreateSnapshot> {
    const defaultDate = this.fiscalYearDateRange.defaultDate();
    const ledgerId = this.resolveBankLedgerId(txn);
    const debit = Number(txn.debit ?? 0);
    const credit = Number(txn.credit ?? 0);
    const fullAmount = roundMoney(debit > 0 ? debit : credit);
    const overrideAmount = options?.bankLedgerAmount;
    const amount =
      overrideAmount !== undefined && overrideAmount > 0
        ? roundMoney(overrideAmount)
        : fullAmount;
    const amountStr = amount > 0 ? formatAmountForInput(amount) : '';

    let ledgerDefaultOptions: readonly Ledger[] = [];
    let ledgerName = '';

    if (ledgerId) {
      await this.ledgerStore.loadLedgers({
        where: { id: { inq: [ledgerId] } },
        limit: 1,
        includes: ['category'],
      });
      ledgerDefaultOptions = this.ledgerStore.items();

      const ledger =
        ledgerDefaultOptions.find((item) => item.id === ledgerId) ??
        (await this.ledgerStore.loadLedgerById(ledgerId, { includes: ['category'] }));
      ledgerName = ledger?.name?.trim() ?? '';
      if (ledger) {
        ledgerDefaultOptions = ledgerDefaultOptions.some((item) => item.id === ledgerId)
          ? ledgerDefaultOptions
          : [ledger, ...ledgerDefaultOptions];
      }
    }

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
          ledgerName,
          debit: debit > 0 ? amountStr : '',
          credit: credit > 0 ? amountStr : '',
        },
        {
          ...newJournalLineRow(),
          debit: credit > 0 ? amountStr : '',
          credit: debit > 0 ? amountStr : '',
        },
      ],
    };
  }

  private resolveBankLedgerId(txn: BankTxn): string {
    const fromInclude = txn.inventoryledgermap?.ledgerid?.trim();
    if (fromInclude) return fromInclude;

    const mapId = txn.inventoryledgermapid?.trim();
    if (!mapId) return '';

    const map =
      txn.inventoryledgermap?.id === mapId
        ? txn.inventoryledgermap
        : this.inventoryLedgerMapStore.items().find((item) => item.id === mapId);

    return map?.ledgerid?.trim() ?? '';
  }
}
