import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  TngCardActionsComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardFooterComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
} from '@tailng-ui/components';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlNavigationService } from '../../../../../../shared/burl-back-button/burl-navigation.service';
import { BurlDeleteButtonComponent } from '../../../../../../shared/burl-delete-button/burl-delete-button.component';
import { BurlEditButtonComponent } from '../../../../../../shared/burl-edit-button/burl-edit-button.component';
import { LedgerStore } from '../../../data/ledger';
import { FiscalYearStore } from '../../../../management/data/fiscal-year/fiscal-year.store';
import { BankCashStore } from '../../../../trading/data/bank-cash';
import { CustomerStore } from '../../../../trading/data/customer';
import { InventoryLedgerMapStore, type InventoryLedgerMap } from '../../../data/inventory-ledger-map';
import { ItemStore } from '../../../../trading/data/item';
import { TaxStore } from '../../../../trading/data/tax';
import { VendorStore } from '../../../../trading/data/vendor';
import {
  formatInventoryLedgerEntityType,
  formatInventoryLedgerType,
} from '../inventory-ledger-map.labels';

@Component({
  selector: 'app-view-inventory-ledger-map',
  standalone: true,
  imports: [
    TngCardActionsComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardFooterComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    BurlBackButtonComponent,
    BurlDeleteButtonComponent,
    BurlEditButtonComponent,
  ],
  templateUrl: './view-inventory-ledger-map.component.html',
  styleUrl: './view-inventory-ledger-map.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewInventoryLedgerMapComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly burlNavigation = inject(BurlNavigationService);
  protected readonly inventoryLedgerMapStore = inject(InventoryLedgerMapStore);
  protected readonly ledgerStore = inject(LedgerStore);
  protected readonly fiscalYearStore = inject(FiscalYearStore);
  protected readonly customerStore = inject(CustomerStore);
  protected readonly vendorStore = inject(VendorStore);
  protected readonly itemStore = inject(ItemStore);
  protected readonly taxStore = inject(TaxStore);
  protected readonly bankCashStore = inject(BankCashStore);

  private readonly ledgerNameById = computed(() => this.nameMap(this.ledgerStore.items()));
  private readonly fiscalYearNameById = computed(() => {
    const map = new Map<string, string>();
    for (const item of this.fiscalYearStore.items()) {
      if (item.id) map.set(item.id, item.name || item.jnumber || item.id);
    }
    return map;
  });

  constructor() {
    void this.loadInitialState();
  }

  protected edit(): void {
    const id = this.inventoryLedgerMapStore.selectedItem()?.id;
    if (!id) return;
    void this.router.navigate(['/app/accounting/inventory-ledger-map', id, 'edit'], {
      queryParams: { burl: this.burlNavigation.getBackUrl() },
    });
  }

  protected delete(): void {
    const id = this.inventoryLedgerMapStore.selectedItem()?.id;
    if (!id) return;
    void this.router.navigate(['/app/accounting/inventory-ledger-map', id, 'delete'], {
      queryParams: { burl: this.burlNavigation.getBackUrl() },
    });
  }

  protected formatEntityType(value: string): string {
    return formatInventoryLedgerEntityType(value);
  }

  protected formatLedgerType(value: string | null | undefined): string {
    return formatInventoryLedgerType(value);
  }

  protected fiscalYearName(id: string | null | undefined): string {
    if (!id) return 'Session fiscal year';
    return this.fiscalYearNameById().get(id) ?? id;
  }

  protected ledgerName(id: string): string {
    return this.ledgerNameById().get(id) ?? id;
  }

  protected entityName(item: InventoryLedgerMap): string {
    if (!item.entityid) return 'System default';
    const map = this.entityNameMap(item.entitytype);
    return map.get(item.entityid) ?? item.entityid;
  }

  protected propsJson(item: InventoryLedgerMap): string {
    return JSON.stringify(item.props ?? {}, null, 2);
  }

  private async loadInitialState(): Promise<void> {
    this.inventoryLedgerMapStore.clearError();
    await this.loadLookups();

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    if (this.inventoryLedgerMapStore.selectedItem()?.id !== id) {
      await this.inventoryLedgerMapStore.loadInventoryLedgerMapById(id);
    }
  }

  private async loadLookups(): Promise<void> {
    await Promise.all([
      this.ledgerStore.loadLedgers({ limit: 1000, offset: 0 }),
      this.fiscalYearStore.loadFiscalYears({ limit: 1000, offset: 0 }),
      this.customerStore.loadCustomers({ limit: 1000, offset: 0 }),
      this.vendorStore.loadVendors({ limit: 1000, offset: 0 }),
      this.itemStore.ensureItemCatalogLoaded(),
      this.taxStore.ensureTaxCatalogLoaded(),
      this.bankCashStore.loadBankCashes({ limit: 1000, offset: 0 }),
    ]);
  }

  private entityNameMap(entityType: string): Map<string, string> {
    switch (entityType) {
      case 'customer':
        return this.nameMap(this.customerStore.items());
      case 'vendor':
        return this.nameMap(this.vendorStore.items());
      case 'item':
        return this.nameMap(this.itemStore.catalog());
      case 'tax':
        return this.nameMap(this.taxStore.catalog());
      case 'bankCash':
        return this.nameMap(this.bankCashStore.items());
      default:
        return new Map<string, string>();
    }
  }

  private nameMap(items: readonly { id?: string; name?: string; displayname?: string }[]): Map<string, string> {
    const map = new Map<string, string>();
    for (const item of items) {
      if (item.id) map.set(item.id, item.displayname || item.name || item.id);
    }
    return map;
  }
}
