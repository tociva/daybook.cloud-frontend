import { Injectable, computed, inject, signal } from '@angular/core';
import { DEFAULT_AUTOCOMPLETE_SEARCH_DEBOUNCE_MS } from '../../../../../../util/constants';
import { BankCashStore, type BankCash } from '../../../../trading/data/bank-cash';
import { CustomerStore, type Customer } from '../../../../trading/data/customer';
import type {
  InventoryLedgerEntityType,
  InventoryLedgerMap,
  InventoryLedgerMapPayload,
  InventoryLedgerType,
} from '../../../data/inventory-ledger-map';
import { ItemStore, type Item } from '../../../../trading/data/item';
import { LedgerStore } from '../../../data/ledger';
import type { Ledger } from '../../../data/ledger';
import { TaxStore, type Tax } from '../../../../trading/data/tax';
import { VendorStore, type Vendor } from '../../../../trading/data/vendor';
import {
  INVENTORY_LEDGER_TYPES_BY_ENTITY,
  entityTypeOptions,
  formatInventoryLedgerEntityType,
  formatInventoryLedgerType,
  ledgerTypeOptions,
} from '../inventory-ledger-map.labels';

type SelectOption<T extends string = string> = Readonly<{ label: string; value: T }>;
type MappingEntity = Customer | Vendor | Item | Tax | BankCash;

@Injectable()
export class InventoryLedgerMapDraftStore {
  private readonly ledgerStore = inject(LedgerStore);
  private readonly customerStore = inject(CustomerStore);
  private readonly vendorStore = inject(VendorStore);
  private readonly itemStore = inject(ItemStore);
  private readonly taxStore = inject(TaxStore);
  private readonly bankCashStore = inject(BankCashStore);

  private ledgerSearchTimer: ReturnType<typeof setTimeout> | null = null;
  private entitySearchTimer: ReturnType<typeof setTimeout> | null = null;
  private ledgerSearchVersion = 0;

  readonly submitted = signal(false);
  readonly entitytype = signal<InventoryLedgerEntityType>('item');
  readonly entityid = signal('');
  readonly entityName = signal('');
  readonly ledgertype = signal<InventoryLedgerType | null>('sale');
  readonly ledgerid = signal('');
  readonly ledgerName = signal('');

  private readonly ledgerDefaultOptions = signal<readonly Ledger[]>([]);
  private readonly ledgerSearchOptions = signal<readonly Ledger[] | null>(null);
  private readonly entitySearchOptions = signal<readonly MappingEntity[] | null>(null);

  readonly entityTypeOptions = entityTypeOptions;
  readonly getOptionLabel = (option: SelectOption): string => option.label;
  readonly getOptionValue = (option: SelectOption): string => option.value;
  readonly trackByValue = (_i: number, option: SelectOption): string => option.value;

  readonly ledgerTypeOptions = computed(() => {
    const allowedTypes = INVENTORY_LEDGER_TYPES_BY_ENTITY[this.entitytype()];
    return ledgerTypeOptions.filter((option) => allowedTypes.includes(option.value));
  });
  readonly showLedgerType = computed(() => this.ledgerTypeOptions().length > 0);
  readonly entityRequired = computed(() => this.entitytype() !== 'system');

  readonly entityError = computed(() =>
    this.submitted() && this.entityRequired() && !this.entityid()
      ? 'Entity is required.'
      : null,
  );
  readonly ledgerError = computed(() =>
    this.submitted() && !this.ledgerid() ? 'Ledger is required.' : null,
  );

  readonly ledgerOptionValue = (item: Ledger): string => item.id ?? '';
  readonly ledgerOptionLabel = (item: Ledger): string => item.name ?? '';
  readonly ledgerTrackBy = (_i: number, item: Ledger): string => item.id ?? '';

  readonly entityOptionValue = (item: MappingEntity): string => item.id ?? '';
  readonly entityOptionLabel = (item: MappingEntity): string => {
    const name = this.entityPrimaryName(item);
    const categoryName = this.entityCategoryName(item);

    return categoryName ? `${name} (${categoryName})` : name;
  };
  readonly entityPrimaryName = (item: MappingEntity): string =>
    'displayname' in item ? item.name || item.displayname : item.name;
  readonly entityCategoryName = (item: MappingEntity): string =>
    this.isItem(item) ? (item.category?.name ?? '') : '';
  readonly entityTrackBy = (_i: number, item: MappingEntity): string => item.id ?? '';

  readonly ledgerAutocompleteOptions = computed(() =>
    this.mergeSelectedLedger(this.ledgerSearchOptions() ?? this.ledgerFallbackOptions()),
  );

  readonly entityAutocompleteOptions = computed(() => {
    const options = this.entitySearchOptions() ?? this.entityStoreItems();
    return this.mergeSelectedEntity(options);
  });

  readonly setupSteps = computed(() => [
    {
      value: 'scope',
      label: 'Scope',
      description: 'Mapped entity',
      completed: !this.entityRequired() || !!this.entityid(),
    },
    {
      value: 'ledger',
      label: 'Ledger',
      description: 'Posting type and ledger account',
      completed: (!this.showLedgerType() || !!this.ledgertype()) && !!this.ledgerid(),
    },
  ] as const);

  readonly activeSetupStep = computed(
    () => this.setupSteps().find((step) => !step.completed)?.value ?? 'ledger',
  );

  readonly displayEntityType = computed(() => formatInventoryLedgerEntityType(this.entitytype()));
  readonly displayLedgerType = computed(() => formatInventoryLedgerType(this.ledgertype()));
  readonly displayEntityName = computed(() => {
    if (this.entitytype() === 'system' || !this.entityid()) return 'System default';
    return this.entityName() || this.entityid();
  });
  readonly displayLedgerName = computed(() => this.ledgerName() || this.ledgerid());

  async patchFromMapping(item: InventoryLedgerMap): Promise<void> {
    this.clearSearchState();
    this.entitytype.set(item.entitytype);
    this.entityid.set(item.entityid ?? '');
    this.ledgertype.set(this.resolveLedgerTypeForEntity(item.entitytype, item.ledgertype));
    this.ledgerid.set(item.ledgerid);
    this.ledgerDefaultOptions.set(this.ledgerStore.items());

    const [ledgerName, entityName] = await Promise.all([
      this.resolveLedgerName(item.ledgerid),
      item.entityid && item.entitytype !== 'system'
        ? this.resolveEntityName(item.entitytype, item.entityid)
        : Promise.resolve(''),
    ]);

    this.ledgerName.set(ledgerName);
    this.entityName.set(entityName);
    await this.loadEntitiesForType(item.entitytype);
  }

  buildPayload(): InventoryLedgerMapPayload {
    return {
      entitytype: this.entitytype(),
      ...(this.entitytype() !== 'system' ? { entityid: this.entityid() } : {}),
      ledgerid: this.ledgerid(),
      ...(this.showLedgerType() && this.ledgertype() ? { ledgertype: this.ledgertype()! } : {}),
    };
  }

  onEntityTypeChange(value: unknown): void {
    const entitytype = this.resolveEntityType(value);
    const ledgerTypes = INVENTORY_LEDGER_TYPES_BY_ENTITY[entitytype];
    const previousType = this.entitytype();

    this.entitytype.set(entitytype);
    if (entitytype === 'system') {
      this.entityid.set('');
      this.entityName.set('');
    } else if (previousType !== entitytype) {
      this.entityid.set('');
      this.entityName.set('');
    }
    this.ledgertype.set(ledgerTypes.length > 0 ? ledgerTypes[0] : null);
    this.entitySearchOptions.set(null);
    void this.loadEntitiesForType(entitytype);
  }

  onEntityChange(value: unknown): void {
    const entityId = typeof value === 'string' ? value : '';
    const entity =
      this.entityAutocompleteOptions().find((item) => item.id === entityId) ??
      this.entityStoreItems().find((item) => item.id === entityId);

    this.entityid.set(entityId);
    this.entityName.set(entity ? this.entityOptionLabel(entity) : '');
  }

  onEntityQueryChange(value: unknown): void {
    const query = this.normalizeQuery(value);
    if (this.entitySearchTimer) clearTimeout(this.entitySearchTimer);
    this.entitySearchTimer = setTimeout(() => {
      void this.loadEntitiesForType(this.entitytype(), query);
    }, DEFAULT_AUTOCOMPLETE_SEARCH_DEBOUNCE_MS);
  }

  onLedgerTypeChange(value: unknown): void {
    this.ledgertype.set(this.resolveLedgerType(value));
  }

  onLedgerAutocompleteFocus(): void {
    if (this.ledgerSearchOptions() === null) {
      this.ledgerSearchOptions.set(this.ledgerFallbackOptions());
    }
    const version = this.nextLedgerSearchVersion();
    void this.loadLedgersForSearch('', version);
  }

  onLedgerChange(value: unknown): void {
    const ledgerId = typeof value === 'string' ? value : '';
    const ledger =
      this.ledgerAutocompleteOptions().find((item) => item.id === ledgerId) ??
      this.ledgerStore.items().find((item) => item.id === ledgerId);

    this.ledgerid.set(ledgerId);
    this.ledgerName.set(ledger?.name ?? '');
  }

  onLedgerQueryChange(value: unknown): void {
    const query = this.normalizeQuery(value);
    const version = this.nextLedgerSearchVersion();
    if (this.ledgerSearchTimer) clearTimeout(this.ledgerSearchTimer);
    this.ledgerSearchTimer = setTimeout(() => {
      void this.loadLedgersForSearch(query, version);
    }, DEFAULT_AUTOCOMPLETE_SEARCH_DEBOUNCE_MS);
  }

  async loadEntitiesForType(type: InventoryLedgerEntityType, query = ''): Promise<void> {
    if (type === 'system') {
      this.entitySearchOptions.set([]);
      return;
    }

    const filter = this.nameQuery(query);
    switch (type) {
      case 'customer':
        await this.customerStore.loadCustomers(filter);
        break;
      case 'vendor':
        await this.vendorStore.loadVendors(filter);
        break;
      case 'item':
        await this.itemStore.loadItems({ ...filter, includes: ['category'] });
        break;
      case 'tax':
        await this.taxStore.loadTaxes(filter);
        break;
      case 'bankCash':
        await this.bankCashStore.loadBankCashes(filter);
        break;
    }

    this.entitySearchOptions.set(this.entityStoreItems());
  }

  private async loadLedgersForSearch(query: string, version: number): Promise<void> {
    await this.ledgerStore.loadLedgers(this.nameQuery(query));
    if (this.ledgerSearchVersion !== version) return;

    const options = this.ledgerStore.items();
    if (!query) {
      this.ledgerDefaultOptions.set(options);
    }
    this.ledgerSearchOptions.set(options);
  }

  private async resolveLedgerName(ledgerId: string): Promise<string> {
    if (!ledgerId) return '';

    const cached = this.ledgerStore.items().find((ledger) => ledger.id === ledgerId);
    if (cached?.name) return cached.name;

    const ledger = await this.ledgerStore.loadLedgerById(ledgerId);
    return ledger?.name ?? '';
  }

  private async resolveEntityName(
    type: InventoryLedgerEntityType,
    entityId: string,
  ): Promise<string> {
    const cached = this.entityStoreItems().find((entity) => entity.id === entityId);
    if (cached) return this.entityOptionLabel(cached);

    switch (type) {
      case 'customer': {
        const customer = await this.customerStore.loadCustomerById(entityId);
        return customer?.name || '';
      }
      case 'vendor': {
        const vendor = await this.vendorStore.loadVendorById(entityId);
        return vendor?.name || '';
      }
      case 'item': {
        const item = await this.itemStore.loadItemById(entityId, { includes: ['category'] });
        return item ? this.entityOptionLabel(item) : '';
      }
      case 'tax': {
        const tax = await this.taxStore.loadTaxById(entityId);
        return tax?.name || '';
      }
      case 'bankCash': {
        const bankCash = await this.bankCashStore.loadBankCashById(entityId);
        return bankCash?.name || '';
      }
      default:
        return '';
    }
  }

  private entityStoreItems(): readonly MappingEntity[] {
    switch (this.entitytype()) {
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
  }

  private mergeSelectedLedger(options: readonly Ledger[]): readonly Ledger[] {
    const map = new Map<string, Ledger>();
    for (const ledger of options) {
      if (ledger.id) map.set(ledger.id, ledger);
    }

    const id = this.ledgerid();
    const name = this.ledgerName();
    if (id && name && !map.has(id)) {
      map.set(id, { id, name, categoryid: '' });
    }

    return [...map.values()];
  }

  private mergeSelectedEntity(options: readonly MappingEntity[]): readonly MappingEntity[] {
    const map = new Map<string, MappingEntity>();
    for (const entity of options) {
      if (entity.id) map.set(entity.id, entity);
    }

    const id = this.entityid();
    const name = this.entityName();
    if (id && name && !map.has(id)) {
      map.set(id, { id, name, displayname: name } as MappingEntity);
    }

    return [...map.values()];
  }

  private ledgerFallbackOptions(): readonly Ledger[] {
    return this.ledgerDefaultOptions().length > 0
      ? this.ledgerDefaultOptions()
      : this.ledgerStore.items();
  }

  private clearSearchState(): void {
    this.ledgerSearchVersion = 0;
    this.ledgerSearchOptions.set(null);
    this.entitySearchOptions.set(null);
  }

  private nextLedgerSearchVersion(): number {
    this.ledgerSearchVersion += 1;
    return this.ledgerSearchVersion;
  }

  private nameQuery(query: string): { limit: number; offset: number; where?: Record<string, unknown> } {
    return query
      ? { limit: 50, offset: 0, where: { name: { ilike: `%${query}%` } } }
      : { limit: 50, offset: 0 };
  }

  private normalizeQuery(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private isItem(item: MappingEntity): item is Item {
    return 'categoryid' in item;
  }

  private resolveEntityType(value: unknown): InventoryLedgerEntityType {
    return entityTypeOptions.some((option) => option.value === value)
      ? (value as InventoryLedgerEntityType)
      : 'item';
  }

  private resolveLedgerType(value: unknown): InventoryLedgerType {
    return this.ledgerTypeOptions().some((option) => option.value === value)
      ? (value as InventoryLedgerType)
      : (this.defaultLedgerType(this.entitytype()) ?? 'sale');
  }

  private defaultLedgerType(entitytype: InventoryLedgerEntityType): InventoryLedgerType | null {
    return INVENTORY_LEDGER_TYPES_BY_ENTITY[entitytype][0] ?? null;
  }

  private resolveLedgerTypeForEntity(
    entitytype: InventoryLedgerEntityType,
    ledgertype: InventoryLedgerType | null | undefined,
  ): InventoryLedgerType | null {
    const allowedTypes = INVENTORY_LEDGER_TYPES_BY_ENTITY[entitytype];
    if (ledgertype && allowedTypes.includes(ledgertype)) return ledgertype;
    return allowedTypes[0] ?? null;
  }
}
