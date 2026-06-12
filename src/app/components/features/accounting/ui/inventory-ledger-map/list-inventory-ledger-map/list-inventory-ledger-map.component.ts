import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  TngButtonComponent,
  TngCardComponent,
  TngTable,
  TngTableCellTpl,
} from '@tailng-ui/components';
import type { TngTableColumn } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import {
  CrudFilterPopoverComponent,
  CrudListQueryService,
  CrudPaginatorComponent,
} from '../../../../../../shared/crud';
import type { CrudFilterField } from '../../../../../../shared/crud';
import { EmptyStateComponent } from '../../../../../../shared/empty-state';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { TableRowIconButtonComponent } from '../../../../../../shared/table-row-icon-button';
import { LedgerStore } from '../../../data/ledger';
import { BankCashStore } from '../../../../trading/data/bank-cash';
import { CustomerStore } from '../../../../trading/data/customer';
import { InventoryLedgerMapStore } from '../../../data/inventory-ledger-map';
import type { InventoryLedgerMap } from '../../../data/inventory-ledger-map';
import { ItemStore } from '../../../../trading/data/item';
import { TaxStore } from '../../../../trading/data/tax';
import { VendorStore } from '../../../../trading/data/vendor';
import {
  entityTypeOptions,
  formatInventoryLedgerEntityType,
  formatInventoryLedgerType,
  ledgerTypeOptions,
} from '../inventory-ledger-map.labels';

@Component({
  selector: 'app-list-inventory-ledger-map',
  standalone: true,
  imports: [
    PageHeadingComponent,
    TngButtonComponent,
    TngCardComponent,
    CrudFilterPopoverComponent,
    CrudPaginatorComponent,
    TngIcon,
    EmptyStateComponent,
    TngTable,
    TngTableCellTpl,
    TableRowIconButtonComponent,
  ],
  templateUrl: './list-inventory-ledger-map.component.html',
  styleUrl: './list-inventory-ledger-map.component.css',
  providers: [CrudListQueryService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListInventoryLedgerMapComponent {
  private readonly router = inject(Router);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly inventoryLedgerMapStore = inject(InventoryLedgerMapStore);
  protected readonly ledgerStore = inject(LedgerStore);
  protected readonly customerStore = inject(CustomerStore);
  protected readonly vendorStore = inject(VendorStore);
  protected readonly itemStore = inject(ItemStore);
  protected readonly taxStore = inject(TaxStore);
  protected readonly bankCashStore = inject(BankCashStore);
  protected readonly hasError = computed(() => this.inventoryLedgerMapStore.error() !== null);

  protected readonly columns: readonly TngTableColumn<InventoryLedgerMap>[] = [
    { id: 'entitytype', label: 'Entity Type', sortable: true, width: '10rem' },
    { id: 'entityid', label: 'Entity', width: '14rem' },
    { id: 'ledgertype', label: 'Ledger Type', sortable: true, width: '12rem' },
    { id: 'ledgerid', label: 'Ledger', width: '14rem' },
    { id: 'actions', label: 'Actions', align: 'end', headerAlign: 'end', width: '8rem' },
  ];

  protected readonly filterFields: readonly CrudFilterField[] = [
    { id: 'entitytype', label: 'Entity Type', type: 'enum', options: entityTypeOptions },
    { id: 'ledgertype', label: 'Ledger Type', type: 'enum', options: ledgerTypeOptions },
  ];

  private readonly ledgerNameById = computed(() => {
    const map = new Map<string, string>();
    for (const ledger of this.ledgerStore.items()) {
      if (ledger.id) map.set(ledger.id, ledger.name);
    }
    return map;
  });

  private readonly customerNameById = computed(() => this.nameMap(this.customerStore.items()));
  private readonly vendorNameById = computed(() => this.nameMap(this.vendorStore.items()));
  private readonly itemNameById = computed(() => this.nameMap(this.itemStore.catalog()));
  private readonly taxNameById = computed(() => this.nameMap(this.taxStore.items()));
  private readonly bankCashNameById = computed(() => this.nameMap(this.bankCashStore.items()));

  constructor() {
    this.crudQuery.init((filter) => void this.inventoryLedgerMapStore.loadInventoryLedgerMaps(filter));
    void this.loadLookupCatalogs();
  }

  protected createInventoryLedgerMap(): void {
    void this.router.navigate(['/app/accounting/inventory-ledger-map/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected viewInventoryLedgerMap(item: InventoryLedgerMap): void {
    if (!item.id) return;
    this.inventoryLedgerMapStore.setSelectedItem(item);
    void this.router.navigate(['/app/accounting/inventory-ledger-map', item.id], {
      queryParams: { burl: this.router.url },
    });
  }

  protected editInventoryLedgerMap(item: InventoryLedgerMap): void {
    if (!item.id) return;
    this.inventoryLedgerMapStore.setSelectedItem(item);
    void this.router.navigate(['/app/accounting/inventory-ledger-map', item.id, 'edit'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected deleteInventoryLedgerMap(item: InventoryLedgerMap): void {
    if (!item.id) return;
    this.inventoryLedgerMapStore.setSelectedItem(item);
    void this.router.navigate(['/app/accounting/inventory-ledger-map', item.id, 'delete'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected formatEntityType(value: string): string {
    return formatInventoryLedgerEntityType(value);
  }

  protected formatLedgerType(value: string | null | undefined): string {
    return formatInventoryLedgerType(value);
  }

  protected ledgerName(id: string): string {
    return this.ledgerNameById().get(id) ?? id;
  }

  protected entityName(item: InventoryLedgerMap): string {
    if (!item.entityid) return 'System default';

    const names = {
      customer: this.customerNameById(),
      vendor: this.vendorNameById(),
      item: this.itemNameById(),
      tax: this.taxNameById(),
      bankCash: this.bankCashNameById(),
      system: new Map<string, string>(),
    }[item.entitytype];

    return names.get(item.entityid) ?? item.entityid;
  }

  private async loadLookupCatalogs(): Promise<void> {
    await Promise.all([
      this.ledgerStore.loadLedgers({ limit: 1000, offset: 0 }),
      this.customerStore.loadCustomers({ limit: 1000, offset: 0 }),
      this.vendorStore.loadVendors({ limit: 1000, offset: 0 }),
      this.itemStore.ensureItemCatalogLoaded(),
      this.taxStore.loadTaxes({ limit: 1000, offset: 0 }),
      this.bankCashStore.loadBankCashes({ limit: 1000, offset: 0 }),
    ]);
  }

  private nameMap(items: readonly { id?: string; name?: string; displayname?: string }[]): Map<string, string> {
    const map = new Map<string, string>();
    for (const item of items) {
      if (item.id) map.set(item.id, item.displayname || item.name || item.id);
    }
    return map;
  }
}
