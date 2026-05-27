import dayjs from 'dayjs';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  TngAutocompleteComponent,
  TngButtonComponent,
  TngCardActionsComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardFooterComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
  TngError,
  TngFormFieldComponent,
  TngInputComponent,
  TngLabelComponent,
  TngStepperComponent,
  TngTextareaComponent,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlCreateButtonComponent } from '../../../../../../shared/burl-create-button/burl-create-button.component';
import { FiscalYearDatepickerComponent } from '../../../../../../shared/fiscal-year-datepicker';
import { FiscalYearDateRangeService } from '../../../../../../shared/fiscal-year-datepicker/fiscal-year-date-range.service';
import { toIsoDate } from '../../../../../../core/date/dayjs-date.utils';
import {
  DEFAULT_AUTOCOMPLETE_SEARCH_DEBOUNCE_MS,
  DEFAULT_NODE_DATE_FORMAT,
} from '../../../../../../util/constants';
import {
  JournalFacade,
  JournalStore,
  isJournalFormRowComplete,
  isJournalFormRowEmpty,
  journalFormRowInput,
  validateJournalEntriesForSubmit,
} from '../../../data/journal';
import type { JournalEntry } from '../../../data/journal';
import { LedgerStore } from '../../../data/ledger';
import type { Ledger } from '../../../data/ledger';

type JournalLineRow = Readonly<{
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

@Component({
  selector: 'app-create-journal',
  standalone: true,
  imports: [
    TngAutocompleteComponent,
    TngButtonComponent,
    TngCardActionsComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardFooterComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    TngError,
    TngFormFieldComponent,
    TngInputComponent,
    TngLabelComponent,
    TngStepperComponent,
    TngTextareaComponent,
    TngIcon,
    FiscalYearDatepickerComponent,
    BurlBackButtonComponent,
    BurlCreateButtonComponent,
  ],
  templateUrl: './create-journal.component.html',
  styleUrl: './create-journal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateJournalComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(JournalFacade);
  protected readonly journalStore = inject(JournalStore);
  protected readonly ledgerStore = inject(LedgerStore);
  private readonly fiscalYearDateRange = inject(FiscalYearDateRangeService);
  private ledgerSearchTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly id = signal<string | null>(null);
  protected readonly submitted = signal(false);

  protected readonly journalDateModel = signal(this.fiscalYearDateRange.defaultDate());
  protected readonly journalNumber = signal('');
  protected readonly journalDescription = signal('');
  protected readonly rows = signal<readonly JournalLineRow[]>([newRow(), newRow()]);

  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly title = computed(() =>
    this.mode() === 'edit' ? 'Edit journal' : 'New journal',
  );

  protected readonly ledgerOptionValue = (ledger: Ledger): string => ledger.id ?? '';
  protected readonly ledgerOptionLabel = (ledger: Ledger): string => ledger.name ?? '';
  protected readonly ledgerTrackBy = (_i: number, ledger: Ledger): string => ledger.id ?? '';

  /** Ensures selected ledgers stay in options so the input shows names, not ids. */
  protected readonly ledgerAutocompleteOptions = computed(() => {
    const map = new Map<string, Ledger>();
    for (const ledger of this.ledgerStore.items()) {
      if (ledger.id) map.set(ledger.id, ledger);
    }
    for (const row of this.rows()) {
      if (row.ledgerId && row.ledgerName && !map.has(row.ledgerId)) {
        map.set(row.ledgerId, {
          id: row.ledgerId,
          name: row.ledgerName,
          categoryid: '',
        });
      }
    }
    return [...map.values()];
  });

  protected readonly journalDateForPicker = computed(() => {
    const s = this.journalDateModel();
    const d = dayjs(s, DEFAULT_NODE_DATE_FORMAT, true);
    return d.isValid() ? d.toDate() : null;
  });

  protected readonly dateError = computed(() =>
    this.submitted()
      ? this.fiscalYearDateRange.errorMessage(this.journalDateModel(), 'Journal date')
      : null,
  );

  protected readonly formRowInputs = computed(() =>
    this.rows().map((r) => journalFormRowInput(r)),
  );

  protected readonly entryErrors = computed(() => {
    if (!this.submitted()) return [] as readonly string[];
    const v = validateJournalEntriesForSubmit(this.formRowInputs());
    return v.ok ? [] : v.errors;
  });

  protected readonly totalsPreview = computed(() => {
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

  protected readonly canSave = computed(() => {
    if (this.journalStore.isLoading()) return false;
    if (this.fiscalYearDateRange.errorMessage(this.journalDateModel(), 'Journal date') !== null) {
      return false;
    }
    return validateJournalEntriesForSubmit(this.formRowInputs()).ok;
  });

  protected readonly setupSteps = computed(() => {
    const dateValid =
      this.journalDateModel().trim().length > 0 &&
      this.fiscalYearDateRange.errorMessage(this.journalDateModel(), 'Journal date') === null;
    const detailsCompleted = dateValid;
    const linesCompleted = validateJournalEntriesForSubmit(this.formRowInputs()).ok;

    return [
      {
        value: 'details',
        label: 'Journal details',
        description: 'Date, number, and narration',
        completed: detailsCompleted,
      },
      {
        value: 'transactions',
        label: 'Transactions',
        description: 'Balanced debit and credit entries',
        completed: linesCompleted,
      },
    ] as const;
  });

  protected readonly activeSetupStep = computed(() => {
    const firstPending = this.setupSteps().find((step) => !step.completed);
    return firstPending?.value ?? 'transactions';
  });

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    this.journalStore.clearError();
    await this.ledgerStore.loadLedgers({ limit: 50, includes: ['category'] });

    const id = this.route.snapshot.paramMap.get('id');
    this.id.set(id);

    if (!id) {
      this.journalStore.clearSelectedItem();
      return;
    }

    const cached = this.journalStore.selectedItem();
    if (cached?.id === id && cached.entries && cached.entries.length > 0) {
      await this.hydrateFromJournal(cached);
      return;
    }

    const journal = await this.journalStore.loadJournalById(id, {
      includes: ['entries', 'documents'],
    });
    if (journal) {
      await this.hydrateFromJournal(journal);
    }
  }

  private async hydrateFromJournal(journal: {
    date: string;
    number: string;
    description?: string;
    entries?: readonly JournalEntry[];
  }): Promise<void> {
    this.journalDateModel.set(journal.date);
    this.journalNumber.set(journal.number ?? '');
    this.journalDescription.set(journal.description ?? '');

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

  protected onDateChange(value: unknown): void {
    this.journalDateModel.set(toIsoDate(value, this.journalDateModel()));
  }

  /**
   * `queryChange` only fires when the query changes. On focus of a new row the query is
   * already empty, so reload the full ledger list (same pattern as sale-invoice line items).
   */
  protected onLedgerAutocompleteFocus(): void {
    if (this.ledgerSearchTimer) {
      clearTimeout(this.ledgerSearchTimer);
      this.ledgerSearchTimer = null;
    }
    void this.loadLedgersForSearch('');
  }

  protected onLedgerQueryChange(event: unknown): void {
    const q = typeof event === 'string' ? event.trim().toLowerCase() : '';
    if (this.ledgerSearchTimer) clearTimeout(this.ledgerSearchTimer);
    if (!q) {
      void this.loadLedgersForSearch('');
      return;
    }
    this.ledgerSearchTimer = setTimeout(() => {
      void this.loadLedgersForSearch(q);
    }, DEFAULT_AUTOCOMPLETE_SEARCH_DEBOUNCE_MS);
  }

  private loadLedgersForSearch(q: string): Promise<void> {
    return this.ledgerStore.loadLedgers(
      q
        ? {
            where: { name: { ilike: `%${q}%` } },
            limit: 50,
            includes: ['category'],
          }
        : { limit: 50, includes: ['category'] },
    );
  }

  protected onLedgerPick(uid: string, value: unknown): void {
    const ledgerId = typeof value === 'string' ? value : '';
    const ledger =
      this.ledgerAutocompleteOptions().find((l) => l.id === ledgerId) ??
      this.ledgerStore.items().find((l) => l.id === ledgerId);
    this.patchRow(uid, {
      ledgerId,
      ledgerName: ledger?.name ?? '',
    });
    this.ensureTrailingEmptyRow();
  }

  protected onDebitChange(uid: string, value: unknown): void {
    const debit = this.normalizeInputValue(value);
    this.patchRow(uid, (row) => ({
      debit,
      credit: this.parseAmount(debit) != null ? '' : row.credit,
    }));
    this.ensureTrailingEmptyRow();
  }

  protected onCreditChange(uid: string, value: unknown): void {
    const credit = this.normalizeInputValue(value);
    this.patchRow(uid, (row) => ({
      credit,
      debit: this.parseAmount(credit) != null ? '' : row.debit,
    }));
    this.ensureTrailingEmptyRow();
  }

  protected addLine(): void {
    this.rows.update((r) => [...r, newRow()]);
  }

  protected removeLine(uid: string): void {
    this.rows.update((r) => {
      if (r.length <= 2) return r;
      return r.filter((row) => row.uid !== uid);
    });
    this.ensureTrailingEmptyRow();
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

  /** Append a blank line once every existing row is complete and none are blank. */
  private ensureTrailingEmptyRow(): void {
    const inputs = this.rows().map((row) => journalFormRowInput(row));
    if (inputs.some(isJournalFormRowEmpty)) return;
    if (!inputs.every(isJournalFormRowComplete)) return;
    this.rows.update((r) => [...r, newRow()]);
  }

  protected async submitForm(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.submitted.set(true);

    if (this.dateError() || !this.canSave()) return;

    const v = validateJournalEntriesForSubmit(this.formRowInputs());
    if (!v.ok) return;

    const payload = {
      date: this.journalDateModel().trim(),
      ...(this.journalNumber().trim() ? { number: this.journalNumber().trim() } : {}),
      ...(this.journalDescription().trim() ? { description: this.journalDescription().trim() } : {}),
      entries: v.entries,
    };

    const currentId = this.id();
    if (currentId) {
      await this.facade.update(currentId, payload);
    } else {
      await this.facade.create(payload);
    }
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
