import { DOCUMENT } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TngButtonComponent, TngCommandPaletteComponent } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { fromEvent } from 'rxjs';
import { LedgerStore } from '../../../components/features/accounting/data/ledger';
import { LedgerCategoryStore } from '../../../components/features/accounting/data/ledger-category';
import { CustomerStore } from '../../../components/features/trading/data/customer';
import { VendorStore } from '../../../components/features/trading/data/vendor';
import { LedgerCachePreferencesStore } from '../../../core/preferences/ledger-cache-preferences.store';
import { isMacPlatform } from '../../../core/system/platform.utils';
import { FiscalYearDateRangeService } from '../../../shared/fiscal-year-date-range-picker';
import {
  PERMISSION,
  permissionForWorkspaceUrl,
} from '../../../core/permissions/permission-requirements';
import { PermissionsStore } from '../../../core/permissions/permissions.store';
import {
  createCustomerTradingSearchIndex,
  searchCustomerTradingEntries,
} from './customer-trading-search';
import {
  createLedgerCategoryReportSearchIndex,
  searchLedgerCategoryReportEntries,
} from './ledger-category-report-search';
import {
  createLedgerReportSearchIndex,
  searchLedgerReportEntries,
} from './ledger-report-search';
import { SearchIndexService } from './search-index.service';
import {
  createVendorTradingSearchIndex,
  searchVendorTradingEntries,
} from './vendor-trading-search';

@Component({
  selector: 'app-workspace-search-button',
  standalone: true,
  imports: [TngButtonComponent, TngCommandPaletteComponent, TngIcon],
  templateUrl: './workspace-search-button.component.html',
  styleUrl: './workspace-search-button.component.css',
})
export class WorkspaceSearchButtonComponent {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly cachePreferences = inject(LedgerCachePreferencesStore);
  private readonly customerStore = inject(CustomerStore);
  private readonly vendorStore = inject(VendorStore);
  private readonly ledgerStore = inject(LedgerStore);
  private readonly ledgerCategoryStore = inject(LedgerCategoryStore);
  private readonly fiscalYearDateRange = inject(FiscalYearDateRangeService);
  private readonly permissions = inject(PermissionsStore);
  private readonly index = toSignal(inject(SearchIndexService).index$, { initialValue: null });
  private customerCatalogLoadPromise: Promise<boolean> | null = null;
  private vendorCatalogLoadPromise: Promise<boolean> | null = null;
  private ledgerCatalogLoadPromise: Promise<boolean> | null = null;
  private ledgerCategoryCatalogLoadPromise: Promise<boolean> | null = null;

  protected readonly searchShortcutHint = isMacPlatform() ? '⌘K' : 'Ctrl K';
  protected readonly open = signal(false);
  protected readonly query = signal('');
  private readonly customerSearchIndex = computed(() =>
    createCustomerTradingSearchIndex(this.customerStore.catalog()),
  );
  private readonly vendorSearchIndex = computed(() =>
    createVendorTradingSearchIndex(this.vendorStore.catalog()),
  );
  private readonly reportDateQuery = computed(() => {
    const range = this.fiscalYearDateRange.range();
    return range ? { start: range.startdate, end: range.enddate } : undefined;
  });
  private readonly ledgerReportSearchIndex = computed(() =>
    createLedgerReportSearchIndex(this.ledgerStore.catalog(), this.reportDateQuery()),
  );
  private readonly ledgerCategoryReportSearchIndex = computed(() =>
    createLedgerCategoryReportSearchIndex(
      this.ledgerCategoryStore.catalog(),
      this.reportDateQuery(),
    ),
  );

  protected readonly results = computed(() => {
    const index = this.index();
    if (!index) return [];

    const q = this.query().trim();
    const entries = (q ? index.fuse.search(q).map((r) => r.item) : index.entries).filter(
      (entry) => {
        const requirement = permissionForWorkspaceUrl(entry.url);
        return requirement ? this.permissions.can(requirement) : false;
      },
    );
    const staticResults = entries.map((entry) => ({
      label: entry.title,
      description: entry.description,
      value: entry.url,
    }));

    if (!q || !this.cachePreferences.enabled()) return staticResults;

    const customerResults = this.permissions.can(PERMISSION.branch.customer.view)
      ? searchCustomerTradingEntries(this.customerSearchIndex(), q).map((entry) => ({
          label: entry.label,
          description: entry.description,
          value: entry.value,
        }))
      : [];
    const vendorResults = this.permissions.can(PERMISSION.branch.vendor.view)
      ? searchVendorTradingEntries(this.vendorSearchIndex(), q).map((entry) => ({
          label: entry.label,
          description: entry.description,
          value: entry.value,
        }))
      : [];
    const ledgerResults =
      this.permissions.can(PERMISSION.fiscalYear.ledger.view) &&
      this.permissions.can(PERMISSION.fiscalYear.accountingReports.ledgerReport)
        ? searchLedgerReportEntries(this.ledgerReportSearchIndex(), q).map((entry) => ({
            label: entry.label,
            description: entry.description,
            value: entry.value,
          }))
        : [];
    const categoryResults =
      this.permissions.can(PERMISSION.fiscalYear.ledgerCategory.view) &&
      this.permissions.can(PERMISSION.fiscalYear.accountingReports.ledgerCategoryReport)
        ? searchLedgerCategoryReportEntries(this.ledgerCategoryReportSearchIndex(), q).map(
            (entry) => ({
              label: entry.label,
              description: entry.description,
              value: entry.value,
            }),
          )
        : [];

    return [...staticResults, ...customerResults, ...vendorResults, ...ledgerResults, ...categoryResults];
  });

  constructor() {
    fromEvent<KeyboardEvent>(this.document, 'keydown')
      .pipe(takeUntilDestroyed())
      .subscribe((event) => this.onDocumentKeydown(event));
  }

  protected openPalette(initialQuery = ''): void {
    this.query.set(initialQuery);
    this.open.set(true);
    this.ensureCustomerSearchCatalogLoaded();
    this.ensureVendorSearchCatalogLoaded();
    this.ensureLedgerSearchCatalogLoaded();
    this.ensureLedgerCategorySearchCatalogLoaded();
  }

  protected onSearchBtnKeydown(event: KeyboardEvent): void {
    // Let Cmd/Ctrl+K fall through to the document listener
    if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing || event.repeat) {
      return;
    }
    // Single visible (non-whitespace) character → open with it pre-filled
    if (event.key.length === 1 && event.key.trim().length === 1) {
      event.preventDefault();
      this.openPalette(event.key);
    }
  }

  private onDocumentKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.openPalette('');
    }
  }

  protected onOptionSelect(event: { option: { label: string; value?: string } }): void {
    const url = event.option.value;
    if (url) {
      this.open.set(false);
      this.router.navigateByUrl(url);
    }
  }

  private ensureCustomerSearchCatalogLoaded(): void {
    if (
      !this.permissions.can(PERMISSION.branch.customer.view) ||
      !this.cachePreferences.enabled() ||
      this.customerStore.catalogLoaded() ||
      this.customerCatalogLoadPromise
    ) {
      return;
    }

    this.customerCatalogLoadPromise = this.customerStore
      .ensureCustomerCatalogLoaded()
      .catch(() => false)
      .finally(() => {
        this.customerCatalogLoadPromise = null;
      });
  }

  private ensureVendorSearchCatalogLoaded(): void {
    if (
      !this.permissions.can(PERMISSION.branch.vendor.view) ||
      !this.cachePreferences.enabled() ||
      this.vendorStore.catalogLoaded() ||
      this.vendorCatalogLoadPromise
    ) {
      return;
    }

    this.vendorCatalogLoadPromise = this.vendorStore
      .ensureVendorCatalogLoaded()
      .catch(() => false)
      .finally(() => {
        this.vendorCatalogLoadPromise = null;
      });
  }

  private ensureLedgerSearchCatalogLoaded(): void {
    if (
      !this.permissions.can(PERMISSION.fiscalYear.ledger.view) ||
      !this.permissions.can(PERMISSION.fiscalYear.accountingReports.ledgerReport) ||
      !this.cachePreferences.enabled() ||
      this.ledgerStore.catalogLoaded() ||
      this.ledgerCatalogLoadPromise
    ) {
      return;
    }

    this.ledgerCatalogLoadPromise = this.ledgerStore
      .ensureLedgerCatalogLoaded()
      .catch(() => false)
      .finally(() => {
        this.ledgerCatalogLoadPromise = null;
      });
  }

  private ensureLedgerCategorySearchCatalogLoaded(): void {
    if (
      !this.permissions.can(PERMISSION.fiscalYear.ledgerCategory.view) ||
      !this.permissions.can(PERMISSION.fiscalYear.accountingReports.ledgerCategoryReport) ||
      !this.cachePreferences.enabled() ||
      this.ledgerCategoryStore.catalogLoaded() ||
      this.ledgerCategoryCatalogLoadPromise
    ) {
      return;
    }

    this.ledgerCategoryCatalogLoadPromise = this.ledgerCategoryStore
      .ensureLedgerCategoryCatalogLoaded()
      .catch(() => false)
      .finally(() => {
        this.ledgerCategoryCatalogLoadPromise = null;
      });
  }
}
