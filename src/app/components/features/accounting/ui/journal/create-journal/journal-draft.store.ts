import { Injectable, computed, inject, signal } from '@angular/core';
import dayjs from 'dayjs';
import { FiscalYearDateRangeService } from '../../../../../../shared/fiscal-year-date-range-picker/fiscal-year-date-range.service';
import { toIsoDate } from '../../../../../../core/date/dayjs-date.utils';
import { DEFAULT_NODE_DATE_FORMAT } from '../../../../../../util/constants';
import {
  isJournalFormRowComplete,
  isJournalFormRowEmpty,
  journalFormRowInput,
  validateJournalEntriesForSubmit,
} from '../../../data/journal';
import type { BankTxn } from '../../../data/bank-txn';
import type { JournalEntry } from '../../../data/journal';
import { LedgerStore } from '../../../data/ledger';
import type { Ledger } from '../../../data/ledger';

export type JournalLineRow = Readonly<{
  uid: string;
  ledgerId: string;
  ledgerName: string;
  debit: string;
  credit: string;
}>;

const newRow = (): JournalLineRow => ({
  uid: crypto.randomUUID(),
  ledgerId: '',
  ledgerName: '',
  debit: '',
  credit: '',
});

@Injectable()
export class JournalDraftStore {
  private readonly fiscalYearDateRange = inject(FiscalYearDateRangeService);
  private readonly ledgerStore = inject(LedgerStore);
  private readonly ledgerSearchVersions = new Map<string, number>();

  readonly submitted = signal(false);
  readonly journalDateModel = signal(this.fiscalYearDateRange.defaultDate());
  readonly journalNumber = signal('');
  readonly journalDescription = signal('');
  readonly rows = signal<readonly JournalLineRow[]>([newRow(), newRow()]);
  private readonly ledgerDefaultOptions = signal<readonly Ledger[]>([]);
  private readonly ledgerOptionsByRow = signal<Readonly<Record<string, readonly Ledger[]>>>({});

  readonly ledgerOptionValue = (ledger: Ledger): string => ledger.id ?? '';
  readonly ledgerOptionLabel = (ledger: Ledger): string => ledger.name ?? '';
  readonly ledgerTrackBy = (_i: number, ledger: Ledger): string => ledger.id ?? '';

  readonly ledgerAutocompleteOptions = (uid: string): readonly Ledger[] => {
    return this.mergeSelectedLedgerOptions(
      uid,
      this.ledgerOptionsByRow()[uid] ?? this.ledgerFallbackOptions(),
    );
  };

  private mergeSelectedLedgerOptions(uid: string, options: readonly Ledger[]): readonly Ledger[] {
    const map = new Map<string, Ledger>();
    for (const ledger of options) {
      if (ledger.id) map.set(ledger.id, ledger);
    }
    const row = this.rows().find((entry) => entry.uid === uid);
    if (row?.ledgerId && row.ledgerName && !map.has(row.ledgerId)) {
      map.set(row.ledgerId, {
        id: row.ledgerId,
        name: row.ledgerName,
        categoryid: '',
      });
    }
    return [...map.values()];
  }

  readonly journalDateForPicker = computed(() => {
    const s = this.journalDateModel();
    const d = dayjs(s, DEFAULT_NODE_DATE_FORMAT, true);
    return d.isValid() ? d.toDate() : null;
  });

  readonly dateError = computed(() =>
    this.submitted()
      ? this.fiscalYearDateRange.errorMessage(this.journalDateModel(), 'Journal date')
      : null,
  );

  readonly formRowInputs = computed(() => this.rows().map((r) => journalFormRowInput(r)));

  readonly entryErrors = computed(() => {
    if (!this.submitted()) return [] as readonly string[];
    const v = validateJournalEntriesForSubmit(this.formRowInputs());
    return v.ok ? [] : v.errors;
  });

  readonly totalsPreview = computed(() => {
    let debit = 0;
    let credit = 0;
    const minor = 2;
    const factor = 10 ** minor;
    for (const r of this.rows()) {
      const dr = this.parseAmount(r.debit);
      const cr = this.parseAmount(r.credit);
      if (dr != null) debit += dr;
      if (cr != null) credit += cr;
    }
    debit = Math.round(debit * factor) / factor;
    credit = Math.round(credit * factor) / factor;
    return { debit, credit, diff: debit - credit, balanced: debit === credit && debit > 0 };
  });

  readonly canSave = computed(() => {
    if (this.fiscalYearDateRange.errorMessage(this.journalDateModel(), 'Journal date') !== null) {
      return false;
    }
    return validateJournalEntriesForSubmit(this.formRowInputs()).ok;
  });

  async hydrateFromJournal(journal: {
    date: string;
    number: string;
    description?: string;
    entries?: readonly JournalEntry[];
  }): Promise<void> {
    this.clearLedgerSearchState();
    this.journalDateModel.set(journal.date);
    this.journalNumber.set(journal.number ?? '');
    this.journalDescription.set(journal.description ?? '');
    this.ledgerDefaultOptions.set(this.ledgerStore.items());

    const entries = journal.entries ?? [];
    if (entries.length === 0) {
      this.rows.set([newRow(), newRow()]);
      return;
    }

    const ledgerIds = [...new Set(entries.map((e) => e.ledgerid).filter(Boolean))];
    if (ledgerIds.length > 0) {
      await this.ledgerStore.loadLedgers({
        where: { id: { inq: ledgerIds } },
        limit: Math.max(ledgerIds.length, 10),
        includes: ['category'],
      });
    }

    const nameById = new Map(
      this.ledgerStore.items().flatMap((l) => (l.id ? [[l.id, l.name ?? ''] as const] : [])),
    );

    this.rows.set(
      entries.map((e) => ({
        uid: crypto.randomUUID(),
        ledgerId: e.ledgerid,
        ledgerName: nameById.get(e.ledgerid) ?? '',
        debit: e.debit != null && e.debit > 0 ? String(e.debit) : '',
        credit: e.credit != null && e.credit > 0 ? String(e.credit) : '',
      })),
    );
    this.ensureTrailingEmptyRow();
  }

  async hydrateFromBankTxn(txn: BankTxn): Promise<void> {
    this.clearLedgerSearchState();

    const ledgerId = txn.inventoryledgermap?.ledgerid ?? '';
    const debit = Number(txn.debit ?? 0);
    const credit = Number(txn.credit ?? 0);
    const amount = debit > 0 ? debit : credit;
    const amountStr = amount > 0 ? String(amount) : '';

    this.journalDateModel.set(toIsoDate(txn.txndate, this.journalDateModel()));
    this.journalDescription.set(txn.description?.trim() || txn.bankref?.trim() || '');

    if (ledgerId) {
      await this.ledgerStore.loadLedgers({
        where: { id: { inq: [ledgerId] } },
        limit: 1,
        includes: ['category'],
      });
    }
    this.ledgerDefaultOptions.set(this.ledgerStore.items());

    const ledger = this.ledgerStore.items().find((item) => item.id === ledgerId);

    this.rows.set([
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
    ]);
  }

  onDateChange(value: unknown): void {
    this.journalDateModel.set(toIsoDate(value, this.journalDateModel()));
  }

  onLedgerAutocompleteFocus(uid: string): void {
    this.ensureLedgerOptionsForRow(uid);
    const version = this.nextLedgerSearchVersion(uid);
    void this.loadLedgersForSearch(uid, '', version);
  }

  onLedgerQueryChange(uid: string, event: unknown): void {
    const q = typeof event === 'string' ? event.trim().toLowerCase() : '';
    const version = this.nextLedgerSearchVersion(uid);
    void this.loadLedgersForSearch(uid, q, version);
  }

  onLedgerPick(uid: string, value: unknown): void {
    const ledgerId = typeof value === 'string' ? value : '';
    const ledger =
      this.ledgerAutocompleteOptions(uid).find((l) => l.id === ledgerId) ??
      this.ledgerStore.items().find((l) => l.id === ledgerId);
    this.patchRow(uid, {
      ledgerId,
      ledgerName: ledger?.name ?? '',
    });
    this.ensureTrailingEmptyRow();
  }

  isDebitDisabled(row: JournalLineRow): boolean {
    return this.parseAmount(row.credit) != null;
  }

  isCreditDisabled(row: JournalLineRow): boolean {
    return this.parseAmount(row.debit) != null;
  }

  onDebitChange(uid: string, value: unknown): void {
    const debit = this.normalizeInputValue(value);
    this.patchRow(uid, (row) => ({
      debit,
      credit: this.parseAmount(debit) != null ? '' : row.credit,
    }));
    this.ensureTrailingEmptyRow();
  }

  onCreditChange(uid: string, value: unknown): void {
    const credit = this.normalizeInputValue(value);
    this.patchRow(uid, (row) => ({
      credit,
      debit: this.parseAmount(credit) != null ? '' : row.debit,
    }));
    this.ensureTrailingEmptyRow();
  }

  addLine(): void {
    this.rows.update((r) => [...r, newRow()]);
  }

  removeLine(uid: string): void {
    this.ledgerSearchVersions.delete(uid);
    this.ledgerOptionsByRow.update((optionsByRow) => {
      const { [uid]: _removed, ...remaining } = optionsByRow;
      return remaining;
    });
    this.rows.update((r) => {
      if (r.length <= 2) return r;
      return r.filter((row) => row.uid !== uid);
    });
    this.ensureTrailingEmptyRow();
  }

  validatedEntries(): ReturnType<typeof validateJournalEntriesForSubmit> {
    return validateJournalEntriesForSubmit(this.formRowInputs());
  }

  private async loadLedgersForSearch(uid: string, q: string, version: number): Promise<void> {
    await this.ledgerStore.loadLedgers(
      q
        ? {
            where: { name: { ilike: `%${q}%` } },
            limit: 50,
            includes: ['category'],
          }
        : { limit: 50, includes: ['category'] },
    );
    if (this.ledgerSearchVersions.get(uid) !== version) return;

    const options = this.ledgerStore.items();
    if (!q) {
      this.ledgerDefaultOptions.set(options);
    }
    this.ledgerOptionsByRow.update((optionsByRow) => ({
      ...optionsByRow,
      [uid]: options,
    }));
  }

  private ensureLedgerOptionsForRow(uid: string): void {
    if (this.ledgerOptionsByRow()[uid]) return;

    this.ledgerOptionsByRow.update((optionsByRow) => ({
      ...optionsByRow,
      [uid]: this.ledgerFallbackOptions(),
    }));
  }

  private ledgerFallbackOptions(): readonly Ledger[] {
    return this.ledgerDefaultOptions().length > 0
      ? this.ledgerDefaultOptions()
      : this.ledgerStore.items();
  }

  private nextLedgerSearchVersion(uid: string): number {
    const next = (this.ledgerSearchVersions.get(uid) ?? 0) + 1;
    this.ledgerSearchVersions.set(uid, next);
    return next;
  }

  private clearLedgerSearchState(): void {
    this.ledgerSearchVersions.clear();
    this.ledgerOptionsByRow.set({});
  }

  private patchRow(
    uid: string,
    patch: Partial<JournalLineRow> | ((row: JournalLineRow) => Partial<JournalLineRow>),
  ): void {
    this.rows.update((list) =>
      list.map((row) => {
        if (row.uid !== uid) return row;
        const nextPatch = typeof patch === 'function' ? patch(row) : patch;
        return { ...row, ...nextPatch };
      }),
    );
  }

  private ensureTrailingEmptyRow(): void {
    const inputs = this.rows().map((row) => journalFormRowInput(row));
    if (inputs.some(isJournalFormRowEmpty)) return;
    if (!inputs.every(isJournalFormRowComplete)) return;
    this.rows.update((r) => [...r, newRow()]);
  }

  private normalizeInputValue(value: unknown): string {
    if (value == null) return '';
    return String(value);
  }

  private parseAmount(raw: string): number | null {
    const t = raw.trim().replace(/,/g, '');
    if (!t) return null;
    const n = Number.parseFloat(t);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  }
}
