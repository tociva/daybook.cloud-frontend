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
  TngLabelComponent,
  TngSelectComponent,
  TngStepperComponent,
  TngTextareaComponent,
} from '@tailng-ui/components';
import { DEFAULT_AUTOCOMPLETE_SEARCH_DEBOUNCE_MS } from '../../../../../../util/constants';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlCreateButtonComponent } from '../../../../../../shared/burl-create-button/burl-create-button.component';
import { LedgerStore } from '../../../../accounting/data/ledger';
import type { Ledger } from '../../../../accounting/data/ledger';
import { FiscalYearStore } from '../../../../management/data/fiscal-year/fiscal-year.store';
import type { FiscalYear } from '../../../../management/data/fiscal-year/fiscal-year.model';
import { BankCashStore, type BankCash } from '../../../data/bank-cash';
import { CustomerStore, type Customer } from '../../../data/customer';
import {
  InventoryLedgerMapFacade,
  InventoryLedgerMapStore,
  type InventoryLedgerEntityType,
  type InventoryLedgerMapPayload,
  type InventoryLedgerType,
} from '../../../data/inventory-ledger-map';
import { ItemStore, type Item } from '../../../data/item';
import { TaxStore, type Tax } from '../../../data/tax';
import { VendorStore, type Vendor } from '../../../data/vendor';
import { entityTypeOptions, ledgerTypeOptions } from '../inventory-ledger-map.labels';

type SelectOption<T extends string = string> = Readonly<{ label: string; value: T }>;

type MappingEntity = Customer | Vendor | Item | Tax | BankCash;

type InventoryLedgerMapFormModel = {
  fiscalyearid: string;
  entitytype: InventoryLedgerEntityType;
  entityid: string;
  ledgertype: InventoryLedgerType;
  ledgerid: string;
  propsJson: string;
};

@Component({
  selector: 'app-create-inventory-ledger-map',
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
    TngLabelComponent,
    TngSelectComponent,
    TngStepperComponent,
    TngTextareaComponent,
    BurlBackButtonComponent,
    BurlCreateButtonComponent,
  ],
  templateUrl: './create-inventory-ledger-map.component.html',
  styleUrl: './create-inventory-ledger-map.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateInventoryLedgerMapComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(InventoryLedgerMapFacade);
  protected readonly inventoryLedgerMapStore = inject(InventoryLedgerMapStore);
  protected readonly ledgerStore = inject(LedgerStore);
  protected readonly fiscalYearStore = inject(FiscalYearStore);
  protected readonly customerStore = inject(CustomerStore);
  protected readonly vendorStore = inject(VendorStore);
  protected readonly itemStore = inject(ItemStore);
  protected readonly taxStore = inject(TaxStore);
  protected readonly bankCashStore = inject(BankCashStore);

  protected readonly id = signal<string | null>(null);
  protected readonly submitted = signal(false);

  protected readonly entityTypeOptions = entityTypeOptions;
  protected readonly ledgerTypeOptions = ledgerTypeOptions;
  protected readonly getOptionLabel = (option: SelectOption): string => option.label;
  protected readonly getOptionValue = (option: SelectOption): string => option.value;
  protected readonly trackByValue = (_i: number, option: SelectOption): string => option.value;

  protected readonly model = signal<InventoryLedgerMapFormModel>({
    fiscalyearid: '',
    entitytype: 'item',
    entityid: '',
    ledgertype: 'sale',
    ledgerid: '',
    propsJson: '{}',
  });

  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly title = computed(() =>
    this.mode() === 'edit' ? 'Edit Inventory Ledger Mapping' : 'New Inventory Ledger Mapping',
  );
  protected readonly entityRequired = computed(() => this.model().entitytype !== 'system');

  protected readonly fiscalYearError = computed(() =>
    this.submitted() && !this.model().fiscalyearid ? 'Fiscal year is required.' : null,
  );
  protected readonly entityError = computed(() =>
    this.submitted() && this.entityRequired() && !this.model().entityid
      ? 'Entity is required.'
      : null,
  );
  protected readonly ledgerError = computed(() =>
    this.submitted() && !this.model().ledgerid ? 'Ledger is required.' : null,
  );
  protected readonly propsError = computed(() => {
    if (!this.submitted()) return null;
    return this.parseProps() === null ? 'Props must be valid JSON object syntax.' : null;
  });

  protected readonly fiscalYearOptionValue = (item: FiscalYear): string => item.id ?? '';
  protected readonly fiscalYearOptionLabel = (item: FiscalYear): string =>
    item.name || item.jnumber || `${item.startdate} - ${item.enddate}`;
  protected readonly fiscalYearTrackBy = (_i: number, item: FiscalYear): string => item.id ?? '';

  protected readonly ledgerOptionValue = (item: Ledger): string => item.id ?? '';
  protected readonly ledgerOptionLabel = (item: Ledger): string => item.name ?? '';
  protected readonly ledgerTrackBy = (_i: number, item: Ledger): string => item.id ?? '';

  protected readonly entityOptions = computed<readonly MappingEntity[]>(() => {
    switch (this.model().entitytype) {
      case 'customer':
        return this.customerStore.items();
      case 'vendor':
        return this.vendorStore.items();
      case 'item':
        return this.itemStore.items();
      case 'tax':
        return this.taxStore.items();
      case 'bankCash':
        return this.bankCashStore.items();
      case 'system':
      default:
        return [];
    }
  });
  protected readonly entityOptionValue = (item: MappingEntity): string => item.id ?? '';
  protected readonly entityOptionLabel = (item: MappingEntity): string =>
    'displayname' in item ? item.displayname || item.name : item.name;
  protected readonly entityTrackBy = (_i: number, item: MappingEntity): string => item.id ?? '';

  protected readonly setupSteps = computed(() => {
    const m = this.model();
    return [
      {
        value: 'scope',
        label: 'Scope',
        description: 'Fiscal year and mapped entity',
        completed: !!m.fiscalyearid && (!this.entityRequired() || !!m.entityid),
      },
      {
        value: 'ledger',
        label: 'Ledger',
        description: 'Posting type and ledger account',
        completed: !!m.ledgertype && !!m.ledgerid,
      },
      {
        value: 'props',
        label: 'Props',
        description: 'Optional JSON metadata',
        completed: this.parseProps() !== null,
      },
    ] as const;
  });
  protected readonly activeSetupStep = computed(
    () => this.setupSteps().find((step) => !step.completed)?.value ?? 'props',
  );

  private fiscalYearSearchTimer: ReturnType<typeof setTimeout> | null = null;
  private ledgerSearchTimer: ReturnType<typeof setTimeout> | null = null;
  private entitySearchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    void this.loadInitialState();
  }

  protected onFiscalYearChange(value: unknown): void {
    this.model.update((m) => ({ ...m, fiscalyearid: typeof value === 'string' ? value : '' }));
  }

  protected onFiscalYearQueryChange(value: unknown): void {
    this.debounceFiscalYears(this.normalizeQuery(value));
  }

  protected onEntityTypeChange(value: unknown): void {
    const entitytype = this.resolveEntityType(value);
    this.model.update((m) => ({
      ...m,
      entitytype,
      entityid: entitytype === 'system' ? '' : m.entitytype === entitytype ? m.entityid : '',
    }));
    void this.loadEntities(entitytype);
  }

  protected onEntityChange(value: unknown): void {
    this.model.update((m) => ({ ...m, entityid: typeof value === 'string' ? value : '' }));
  }

  protected onEntityQueryChange(value: unknown): void {
    const query = this.normalizeQuery(value);
    if (this.entitySearchTimer) clearTimeout(this.entitySearchTimer);
    this.entitySearchTimer = setTimeout(() => {
      void this.loadEntities(this.model().entitytype, query);
    }, DEFAULT_AUTOCOMPLETE_SEARCH_DEBOUNCE_MS);
  }

  protected onLedgerTypeChange(value: unknown): void {
    this.model.update((m) => ({ ...m, ledgertype: this.resolveLedgerType(value) }));
  }

  protected onLedgerChange(value: unknown): void {
    this.model.update((m) => ({ ...m, ledgerid: typeof value === 'string' ? value : '' }));
  }

  protected onLedgerQueryChange(value: unknown): void {
    const query = this.normalizeQuery(value);
    if (this.ledgerSearchTimer) clearTimeout(this.ledgerSearchTimer);
    this.ledgerSearchTimer = setTimeout(() => {
      void this.ledgerStore.loadLedgers(this.nameQuery(query));
    }, DEFAULT_AUTOCOMPLETE_SEARCH_DEBOUNCE_MS);
  }

  protected onPropsChange(value: unknown): void {
    this.model.update((m) => ({ ...m, propsJson: typeof value === 'string' ? value : String(value ?? '') }));
  }

  protected async submitForm(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.submitted.set(true);

    const props = this.parseProps();
    if (this.fiscalYearError() || this.entityError() || this.ledgerError() || props === null) return;

    const m = this.model();
    const payload: InventoryLedgerMapPayload = {
      fiscalyearid: m.fiscalyearid,
      entitytype: m.entitytype,
      entityid: m.entitytype === 'system' ? null : m.entityid,
      ledgertype: m.ledgertype,
      ledgerid: m.ledgerid,
      props,
    };

    const currentId = this.id();
    if (currentId) {
      await this.facade.update(currentId, payload);
    } else {
      await this.facade.create(payload);
    }
  }

  private async loadInitialState(): Promise<void> {
    this.inventoryLedgerMapStore.clearError();
    await Promise.all([
      this.fiscalYearStore.loadFiscalYears({ limit: 50, offset: 0 }),
      this.ledgerStore.loadLedgers({ limit: 50, offset: 0 }),
      this.loadEntities(this.model().entitytype),
    ]);

    const id = this.route.snapshot.paramMap.get('id');
    this.id.set(id);

    if (!id) {
      this.inventoryLedgerMapStore.clearSelectedItem();
      return;
    }

    const cached = this.inventoryLedgerMapStore.selectedItem();
    const item = cached?.id === id ? cached : await this.inventoryLedgerMapStore.loadInventoryLedgerMapById(id);
    if (!item) return;

    this.model.set({
      fiscalyearid: item.fiscalyearid,
      entitytype: item.entitytype,
      entityid: item.entityid ?? '',
      ledgertype: item.ledgertype,
      ledgerid: item.ledgerid,
      propsJson: JSON.stringify(item.props ?? {}, null, 2),
    });
    await this.loadEntities(item.entitytype);
  }

  private debounceFiscalYears(query: string): void {
    if (this.fiscalYearSearchTimer) clearTimeout(this.fiscalYearSearchTimer);
    this.fiscalYearSearchTimer = setTimeout(() => {
      void this.fiscalYearStore.loadFiscalYears(this.nameQuery(query));
    }, DEFAULT_AUTOCOMPLETE_SEARCH_DEBOUNCE_MS);
  }

  private async loadEntities(type: InventoryLedgerEntityType, query = ''): Promise<void> {
    if (type === 'system') return;
    const filter = this.nameQuery(query);
    switch (type) {
      case 'customer':
        await this.customerStore.loadCustomers(filter);
        break;
      case 'vendor':
        await this.vendorStore.loadVendors(filter);
        break;
      case 'item':
        await this.itemStore.loadItems(filter);
        break;
      case 'tax':
        await this.taxStore.loadTaxes(filter);
        break;
      case 'bankCash':
        await this.bankCashStore.loadBankCashes(filter);
        break;
    }
  }

  private nameQuery(query: string): { limit: number; offset: number; where?: Record<string, unknown> } {
    return query
      ? { limit: 50, offset: 0, where: { name: { ilike: `%${query}%` } } }
      : { limit: 50, offset: 0 };
  }

  private parseProps(): Record<string, unknown> | null {
    const raw = this.model().propsJson.trim();
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw) as unknown;
      return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }

  private normalizeQuery(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private resolveEntityType(value: unknown): InventoryLedgerEntityType {
    return entityTypeOptions.some((option) => option.value === value)
      ? (value as InventoryLedgerEntityType)
      : 'item';
  }

  private resolveLedgerType(value: unknown): InventoryLedgerType {
    return ledgerTypeOptions.some((option) => option.value === value)
      ? (value as InventoryLedgerType)
      : 'sale';
  }
}

