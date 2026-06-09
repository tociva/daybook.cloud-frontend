import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  TngAutocompleteComponent,
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
  TngSelectComponent,
  TngStepperComponent,
  TngTextareaComponent,
} from '@tailng-ui/components';
import type { TngDateValue } from '@tailng-ui/primitives';
import { FiscalYearDateRangeService } from '../../../../../../shared/fiscal-year-date-range-picker';
import { FiscalYearDatepickerComponent } from '../../../../../../shared/fiscal-year-datepicker';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlCreateButtonComponent } from '../../../../../../shared/burl-create-button/burl-create-button.component';
import { toIsoDate } from '../../../../../../core/date/dayjs-date.utils';
import {
  DEFAULT_AUTOCOMPLETE_SEARCH_DEBOUNCE_MS,
  DEFAULT_NODE_DATE_FORMAT,
} from '../../../../../../util/constants';
import { BankCashStore } from '../../../../trading/data/bank-cash';
import type { BankCash } from '../../../../trading/data/bank-cash';
import { InventoryLedgerMapStore } from '../../../data/inventory-ledger-map';
import { BankTxnFacade, BankTxnStore } from '../../../data/bank-txn';
import type { BankTxnPayload } from '../../../data/bank-txn';

type AmountType = 'debit' | 'credit';

@Component({
  selector: 'app-create-bank-txn',
  standalone: true,
  imports: [
    TngAutocompleteComponent,
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
    TngSelectComponent,
    TngStepperComponent,
    TngTextareaComponent,
    FiscalYearDatepickerComponent,
    BurlBackButtonComponent,
    BurlCreateButtonComponent,
  ],
  templateUrl: './create-bank-txn.component.html',
  styleUrl: './create-bank-txn.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateBankTxnComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(BankTxnFacade);
  private readonly fiscalYearDateRange = inject(FiscalYearDateRangeService);
  private bankCashSearchTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly bankTxnStore = inject(BankTxnStore);
  protected readonly inventoryLedgerMapStore = inject(InventoryLedgerMapStore);
  protected readonly bankCashStore = inject(BankCashStore);

  protected readonly id = signal<string | null>(null);
  protected readonly submitted = signal(false);

  protected readonly selectedBankCashId = signal('');
  protected readonly bankCashQuery = signal('');
  protected readonly inventoryledgermapid = signal('');
  protected readonly txndate = signal(this.fiscalYearDateRange.defaultDate());
  protected readonly amountType = signal<AmountType>('debit');
  protected readonly amount = signal('');
  protected readonly bankref = signal('');
  protected readonly description = signal('');

  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly title = computed(() =>
    this.mode() === 'edit' ? 'Edit Bank Transaction' : 'New Bank Transaction',
  );

  protected readonly amountTypeOptions: readonly AmountType[] = ['debit', 'credit'];
  protected readonly amountTypeLabel = (value: AmountType): string =>
    value === 'debit' ? 'Deposit' : 'Withdrawal';
  protected readonly amountTypeValue = (value: AmountType): string => value;
  protected readonly amountTypeTrackBy = (_index: number, value: AmountType): string => value;

  protected readonly filteredBankCashes = computed<readonly BankCash[]>(() => {
    const query = this.bankCashQuery().trim().toLowerCase();
    const mappedBankCashIds = new Set(
      this.inventoryLedgerMapStore
        .items()
        .filter((map) => map.entitytype === 'bankCash' && map.entityid)
        .map((map) => map.entityid as string),
    );
    const items = (this.bankCashStore.items() as BankCash[]).filter(
      (item) => item.id && mappedBankCashIds.has(item.id),
    );
    const filtered = !query
      ? items.slice(0, 25)
      : items
          .filter(
            (item) =>
              item.name.toLowerCase().includes(query) ||
              (item.description ?? '').toLowerCase().includes(query),
          )
          .slice(0, 25);

    const selectedId = this.selectedBankCashId();
    if (!selectedId || filtered.some((item) => item.id === selectedId)) {
      return filtered;
    }

    const selected = items.find((item) => item.id === selectedId);
    return selected ? [selected, ...filtered].slice(0, 25) : filtered;
  });

  protected readonly bankCashOptionValue = (bank: BankCash): string => bank.id ?? '';
  protected readonly bankCashOptionLabel = (bank: BankCash): string => bank.name;
  protected readonly bankCashTrackBy = (_index: number, bank: BankCash): string =>
    bank.id ?? bank.name;

  protected readonly bankError = computed(() => {
    if (!this.submitted()) return null;
    if (!this.selectedBankCashId()) return 'Bank account is required.';
    if (!this.inventoryledgermapid().trim()) {
      return 'No ledger mapping found for this bank/cash account.';
    }
    return null;
  });
  protected readonly dateError = computed(() =>
    this.submitted() && !this.txndate() ? 'Transaction date is required.' : null,
  );
  protected readonly amountError = computed(() => {
    if (!this.submitted()) return null;
    const value = Number(this.amount());
    return Number.isFinite(value) && value > 0 ? null : 'Amount must be greater than zero.';
  });

  protected readonly setupSteps = computed(() => {
    const bankDone = this.inventoryledgermapid().trim().length > 0;
    const amountDone = Number(this.amount()) > 0;
    const refDone = this.bankref().trim().length > 0 || this.description().trim().length > 0;
    return [
      {
        value: 'bank',
        label: 'Bank',
        description: 'Mapped bank ledger account',
        completed: bankDone,
      },
      {
        value: 'amount',
        label: 'Amount',
        description: 'Deposit or withdrawal value',
        completed: amountDone,
      },
      {
        value: 'details',
        label: 'Details',
        description: 'Reference and narration',
        completed: refDone,
      },
    ] as const;
  });

  protected readonly activeSetupStep = computed(() => {
    const firstPending = this.setupSteps().find((step) => !step.completed);
    return firstPending?.value ?? 'details';
  });

  constructor() {
    void this.loadInitialState();
  }

  protected onDateChange(value: TngDateValue<Date>): void {
    this.txndate.set(toIsoDate(value, this.txndate() || DEFAULT_NODE_DATE_FORMAT));
  }

  protected onBankCashQueryChange(value: unknown): void {
    const query = typeof value === 'string' ? value.trim() : '';
    this.bankCashQuery.set(query);

    if (this.bankCashSearchTimer) clearTimeout(this.bankCashSearchTimer);
    this.bankCashSearchTimer = setTimeout(() => {
      void this.bankCashStore.loadBankCashes(
        query
          ? { where: { name: { ilike: `%${query}%` } } }
          : { limit: 1000, offset: 0 },
      );
    }, DEFAULT_AUTOCOMPLETE_SEARCH_DEBOUNCE_MS);
  }

  protected onBankCashValueChange(value: unknown): void {
    const bankCashId = typeof value === 'string' ? value : '';
    this.selectedBankCashId.set(bankCashId);
    this.inventoryledgermapid.set(this.resolveInventoryLedgerMapId(bankCashId));
  }

  protected onAmountTypeChange(value: unknown): void {
    this.amountType.set(value === 'credit' ? 'credit' : 'debit');
  }

  protected async submitForm(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.submitted.set(true);
    if (this.bankError() || this.dateError() || this.amountError()) return;

    const currentId = this.id();
    const amount = Number(this.amount());
    const isDebit = this.amountType() === 'debit';
    const payload: BankTxnPayload = {
      inventoryledgermapid: this.inventoryledgermapid().trim(),
      txndate: this.txndate(),
      ...(this.description().trim() ? { description: this.description().trim() } : {}),
      ...(this.bankref().trim() ? { bankref: this.bankref().trim() } : {}),
      ...(isDebit ? { debit: amount } : { credit: amount }),
      ...(currentId ? (isDebit ? { credit: 0 } : { debit: 0 }) : {}),
    };

    if (currentId) {
      await this.facade.update(currentId, payload);
    } else {
      await this.facade.create(payload);
    }
  }

  private async loadInitialState(): Promise<void> {
    this.bankTxnStore.clearError();

    await Promise.all([
      this.inventoryLedgerMapStore.loadInventoryLedgerMaps({
        limit: 1000,
        offset: 0,
        where: { entitytype: 'bankCash' },
      }),
      this.bankCashStore.loadBankCashes({ limit: 1000, offset: 0 }),
    ]);

    const id = this.route.snapshot.paramMap.get('id');
    this.id.set(id);

    if (!id) {
      this.bankTxnStore.clearSelectedItem();
      return;
    }

    const item = await this.bankTxnStore.loadBankTxnById(id, {
      includes: ['inventoryledgermap', 'matches'],
    });
    if (!item) return;

    const debit = Number(item.debit ?? 0);
    const credit = Number(item.credit ?? 0);
    const entityId = item.inventoryledgermap?.entityid ?? '';

    this.inventoryledgermapid.set(item.inventoryledgermapid ?? '');
    this.selectedBankCashId.set(entityId);
    this.txndate.set(item.txndate ?? this.fiscalYearDateRange.defaultDate());
    this.amountType.set(credit > 0 ? 'credit' : 'debit');
    this.amount.set(String(credit > 0 ? credit : debit));
    this.bankref.set(item.bankref ?? '');
    this.description.set(item.description ?? '');

    if (entityId && !this.bankCashStore.items().some((bank) => bank.id === entityId)) {
      await this.bankCashStore.loadBankCashById(entityId);
    }
  }

  private resolveInventoryLedgerMapId(bankCashId: string): string {
    if (!bankCashId) return '';

    return (
      this.inventoryLedgerMapStore
        .items()
        .find((map) => map.entitytype === 'bankCash' && map.entityid === bankCashId)?.id ?? ''
    );
  }
}
