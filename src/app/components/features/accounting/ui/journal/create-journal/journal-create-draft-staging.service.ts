import { Injectable, inject } from '@angular/core';
import { toIsoDate } from '../../../../../../core/date/dayjs-date.utils';
import { FiscalYearDateRangeService } from '../../../../../../shared/fiscal-year-date-range-picker/fiscal-year-date-range.service';
import { formatAmountForInput, roundMoney } from '../../../data/bank-txn';
import type { BankTxn } from '../../../data/bank-txn';
import { InventoryLedgerMapStore } from '../../../data/inventory-ledger-map';
import { LedgerStore } from '../../../data/ledger';
import type { Ledger } from '../../../data/ledger';
import type { Journal, JournalEntry } from '../../../data/journal';
import type { JournalCreateSnapshot, JournalLineRow } from './journal-draft.store';
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

  stage(snapshot: JournalCreateSnapshot): void {
    this.snapshot = {
      ...snapshot,
      autoNumbering: true,
      journalNumber: '',
    };
  }

  async stageFromJournal(
    journal: Pick<Journal, 'date' | 'description' | 'entries'>,
  ): Promise<void> {
    this.snapshot = await this.buildSnapshotFromJournal(journal);
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

  private async buildSnapshotFromJournal(
    journal: Pick<Journal, 'date' | 'description' | 'entries'>,
  ): Promise<JournalCreateSnapshot> {
    const entries = [...(journal.entries ?? [])].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );

    const ledgerIds = [...new Set(entries.map((e) => e.ledgerid).filter(Boolean))];
    let ledgerDefaultOptions: readonly Ledger[] = [];

    if (ledgerIds.length > 0) {
      await this.ledgerStore.loadLedgers({
        where: { id: { inq: ledgerIds } },
        limit: Math.max(ledgerIds.length, 10),
        includes: ['category'],
      });
      ledgerDefaultOptions = this.ledgerStore.items();
    }

    const nameById = new Map(
      ledgerDefaultOptions.flatMap((l) => (l.id ? [[l.id, l.name ?? ''] as const] : [])),
    );

    const rows: JournalLineRow[] = entries.map((e) => this.entryToLineRow(e, nameById));
    this.ensureMinimumRows(rows);

    return {
      autoNumbering: true,
      journalDateModel: journal.date,
      journalNumber: '',
      journalDescription: journal.description ?? '',
      ledgerDefaultOptions,
      rows,
    };
  }

  private entryToLineRow(
    entry: JournalEntry,
    nameById: ReadonlyMap<string, string>,
  ): JournalLineRow {
    return {
      uid: crypto.randomUUID(),
      ledgerId: entry.ledgerid,
      ledgerName: nameById.get(entry.ledgerid) ?? '',
      debit: entry.debit != null && entry.debit > 0 ? String(entry.debit) : '',
      credit: entry.credit != null && entry.credit > 0 ? String(entry.credit) : '',
    };
  }

  private ensureMinimumRows(rows: JournalLineRow[]): void {
    while (rows.length < 2) {
      rows.push(newJournalLineRow());
    }
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
