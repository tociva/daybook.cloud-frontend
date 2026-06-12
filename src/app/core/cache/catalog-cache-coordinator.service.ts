import { Injectable, effect, inject } from '@angular/core';
import { LedgerCategoryStore } from '../../components/features/accounting/data/ledger-category/ledger-category.store';
import { LedgerStore } from '../../components/features/accounting/data/ledger/ledger.store';
import { UserSessionStore } from '../../components/features/management/data/user-session/user-session.store';
import { CustomerStore } from '../../components/features/trading/data/customer/customer.store';
import { ItemCategoryStore } from '../../components/features/trading/data/item-category/item-category.store';
import { ItemStore } from '../../components/features/trading/data/item/item.store';
import { TaxGroupStore } from '../../components/features/trading/data/tax-group/tax-group.store';
import { TaxStore } from '../../components/features/trading/data/tax/tax.store';
import { VendorStore } from '../../components/features/trading/data/vendor/vendor.store';
import { CatalogCacheService, type CatalogCacheScope } from './catalog-cache.service';

@Injectable({ providedIn: 'root' })
export class CatalogCacheCoordinatorService {
  private readonly catalogCache = inject(CatalogCacheService);
  private readonly customerStore = inject(CustomerStore);
  private readonly itemCategoryStore = inject(ItemCategoryStore);
  private readonly itemStore = inject(ItemStore);
  private readonly ledgerCategoryStore = inject(LedgerCategoryStore);
  private readonly ledgerStore = inject(LedgerStore);
  private readonly taxGroupStore = inject(TaxGroupStore);
  private readonly taxStore = inject(TaxStore);
  private readonly userSessionStore = inject(UserSessionStore);
  private readonly vendorStore = inject(VendorStore);
  private previousScope: CatalogCacheScope | null = null;

  constructor() {
    effect(() => {
      const scope = this.catalogCache.currentScope();
      const previousScope = this.previousScope;
      const changed = previousScope !== null && !this.sameScope(previousScope, scope);

      if (changed) {
        this.clearCatalogMemory();
        void Promise.all([
          this.catalogCache.clearScope(previousScope),
          scope ? this.catalogCache.clearScope(scope) : Promise.resolve(),
        ]);
      }

      this.previousScope = scope;
    });
  }

  async refreshAllCatalogs(): Promise<boolean> {
    await this.catalogCache.clearCurrentScope();
    this.clearCatalogMemory();

    const results = await Promise.all([
      this.customerStore.refreshCustomerCatalog(),
      this.itemCategoryStore.refreshItemCategoryCatalog(),
      this.itemStore.refreshItemCatalog(),
      this.ledgerCategoryStore.refreshLedgerCategoryCatalog(),
      this.ledgerStore.refreshLedgerCatalog(),
      this.taxGroupStore.refreshTaxGroupCatalog(),
      this.taxStore.refreshTaxCatalog(),
      this.vendorStore.refreshVendorCatalog(),
    ]);

    return results.every(Boolean);
  }

  async clearAllCatalogs(): Promise<void> {
    this.clearCatalogMemory();
    await this.catalogCache.clearCurrentScope();
  }

  async clearAllPersistedCatalogsForUser(): Promise<void> {
    const userId = this.userSessionStore.session()?.userid;
    this.clearCatalogMemory();
    if (userId) {
      await this.catalogCache.clearUser(userId);
    }
  }

  private clearCatalogMemory(): void {
    this.customerStore.clearCatalog();
    this.itemCategoryStore.clearCatalog();
    this.itemStore.clearCatalog();
    this.ledgerCategoryStore.clearCatalog();
    this.ledgerStore.clearCatalog();
    this.taxGroupStore.clearCatalog();
    this.taxStore.clearCatalog();
    this.vendorStore.clearCatalog();
  }

  private sameScope(left: CatalogCacheScope, right: CatalogCacheScope | null): boolean {
    return (
      right !== null &&
      left.userId === right.userId &&
      left.organizationId === right.organizationId &&
      left.branchId === right.branchId &&
      left.fiscalYearId === right.fiscalYearId
    );
  }
}
