import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  TngButtonComponent,
  TngCardComponent,
  TngTreeTable,
  TngTreeTableCellTpl,
} from '@tailng-ui/components';
import type { TngTreeTableColumn } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { EmptyStateComponent } from '../../../../../../shared/empty-state';
import { TableRowIconButtonComponent } from '../../../../../../shared/table-row-icon-button';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { LedgerStore } from '../../../data/ledger';
import type { Ledger } from '../../../data/ledger';
import { LedgerCategoryStore } from '../../../data/ledger-category';
import type { LedgerCategory } from '../../../data/ledger-category';

type LedgerTreeRow = {
  children: LedgerTreeRow[];
  description: string;
  key: string;
  kind: 'category' | 'ledger';
  name: string;
  openingcr: number;
  openingdr: number;
};

const softColumnBorder =
  '1px solid color-mix(in srgb, var(--tng-semantic-border-subtle) 72%, var(--tng-semantic-foreground-muted) 28%)';

const amountFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const toAmount = (value: number | null | undefined): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

const formatAmount = (value: number | null | undefined): string => {
  const amount = toAmount(value);
  return amount === 0 ? '' : amountFormatter.format(amount);
};

const rowNameClass = (row: LedgerTreeRow): string =>
  `ledger-tree-name-cell ledger-tree-${row.kind}-cell`;

const amountCellClass = (row: LedgerTreeRow): string =>
  `ledger-tree-amount-cell ledger-tree-${row.kind}-cell`;

@Component({
  selector: 'app-tree-view-ledger',
  standalone: true,
  imports: [
    PageHeadingComponent,
    TngButtonComponent,
    TngCardComponent,
    TngIcon,
    TngTreeTable,
    TngTreeTableCellTpl,
    EmptyStateComponent,
    TableRowIconButtonComponent,
  ],
  templateUrl: './tree-view-ledger.component.html',
  styleUrl: './tree-view-ledger.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeViewLedgerComponent implements OnInit {
  private readonly router = inject(Router);
  protected readonly ledgerStore = inject(LedgerStore);
  protected readonly ledgerCategoryStore = inject(LedgerCategoryStore);

  protected readonly expandedKeys = signal<readonly string[]>([]);
  private readonly expandedKeySet = computed(() => new Set(this.expandedKeys()));
  protected readonly displayError = computed(
    () => this.ledgerCategoryStore.error() ?? this.ledgerStore.error(),
  );
  protected readonly hasError = computed(() => this.displayError() !== null);
  protected readonly isLoading = computed(
    () => this.ledgerCategoryStore.isLoading() || this.ledgerStore.isLoading(),
  );

  protected readonly treeData = computed<readonly LedgerTreeRow[]>(() => {
    const categories = this.ledgerCategoryStore.catalog();
    const ledgers = this.ledgerStore.catalog();
    const categoryNodes = new Map<string, LedgerTreeRow>();
    const categoriesById = new Map<string, LedgerCategory>();
    const rootRows: LedgerTreeRow[] = [];

    for (const category of categories) {
      if (!category.id) continue;
      categoriesById.set(category.id, category);
      categoryNodes.set(category.id, this.createCategoryRow(category));
    }

    for (const category of categories) {
      if (!category.id) continue;
      const node = categoryNodes.get(category.id);
      if (!node) continue;

      const parentId = category.parentid ?? category.parent?.id ?? null;
      const parent = parentId && parentId !== category.id ? categoryNodes.get(parentId) : null;
      if (parent) {
        parent.children.push(node);
      } else {
        rootRows.push(node);
      }
    }

    const uncategorizedLedgers: LedgerTreeRow[] = [];
    for (const ledger of ledgers) {
      if (!ledger.id) continue;
      const categoryId = ledger.categoryid ?? ledger.category?.id ?? null;
      const category = categoryId ? categoriesById.get(categoryId) ?? ledger.category : undefined;
      const categoryNode = category?.id ? categoryNodes.get(category.id) : null;
      const row = this.createLedgerRow(ledger);

      if (categoryNode) {
        categoryNode.children.push(row);
      } else {
        uncategorizedLedgers.push(row);
      }
    }

    if (uncategorizedLedgers.length > 0) {
      rootRows.push({
        children: uncategorizedLedgers,
        description: '',
        key: 'category:uncategorized',
        kind: 'category',
        name: 'Uncategorized',
        openingcr: 0,
        openingdr: 0,
      });
    }

    for (const row of rootRows) {
      this.rollUpOpeningAmounts(row);
    }

    return rootRows;
  });

  private readonly expandableTreeKeys = computed(() => {
    const keys: string[] = [];
    const collect = (rows: readonly LedgerTreeRow[]): void => {
      for (const row of rows) {
        if (row.kind === 'category' && row.children.length > 0) {
          keys.push(row.key);
          collect(row.children);
        }
      }
    };
    collect(this.treeData());
    return keys;
  });

  protected readonly columns: readonly TngTreeTableColumn<LedgerTreeRow>[] = [
    {
      key: 'name',
      label: 'Ledger Category / Ledger',
      treeToggle: true,
      width: '26rem',
      cellClass: rowNameClass,
      headerStyle: {
        'border-inline-end': softColumnBorder,
      },
      cellStyle: {
        'border-inline-end': softColumnBorder,
      },
    },
    {
      key: 'opening',
      label: 'Opening',
      headerStyle: {
        'border-inline-end': softColumnBorder,
      },
      children: [
        {
          key: 'openingdr',
          label: 'Debit',
          accessor: (row) =>
            this.shouldHideBranchOpening(row) ? '' : formatAmount(row.openingdr),
          align: 'end',
          width: '10rem',
          cellClass: amountCellClass,
        },
        {
          key: 'openingcr',
          label: 'Credit',
          accessor: (row) =>
            this.shouldHideBranchOpening(row) ? '' : formatAmount(row.openingcr),
          align: 'end',
          width: '10rem',
          cellClass: amountCellClass,
          headerStyle: {
            'border-inline-end': softColumnBorder,
          },
          cellStyle: {
            'border-inline-end': softColumnBorder,
          },
        },
      ],
    },
    {
      key: 'description',
      label: 'Description',
      minWidth: '16rem',
      headerStyle: {
        'border-inline-end': softColumnBorder,
      },
      cellStyle: {
        'border-inline-end': softColumnBorder,
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'end',
      width: '8rem',
    },
  ];

  constructor() {
    effect(() => {
      this.expandedKeys.set(this.expandableTreeKeys());
    });
  }

  ngOnInit(): void {
    void this.loadReferenceData();
  }

  protected createLedger(): void {
    void this.router.navigate(['/app/accounting/ledger/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected createLedgerCategory(): void {
    void this.router.navigate(['/app/accounting/ledger-category/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected onRefresh(): void {
    void this.loadReferenceData();
  }

  protected shouldShowRowActions(row: LedgerTreeRow): boolean {
    return row.key !== 'category:uncategorized';
  }

  protected viewLedger(row: LedgerTreeRow): void {
    const ledger = this.findLedger(row);
    if (!ledger?.id) return;
    this.ledgerStore.setSelectedItem(ledger);
    void this.router.navigate(['/app/accounting/ledger', ledger.id], {
      queryParams: { burl: this.router.url },
    });
  }

  protected editLedger(row: LedgerTreeRow): void {
    const ledger = this.findLedger(row);
    if (!ledger?.id) return;
    this.ledgerStore.setSelectedItem(ledger);
    void this.router.navigate(['/app/accounting/ledger', ledger.id, 'edit'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected deleteLedger(row: LedgerTreeRow): void {
    const ledger = this.findLedger(row);
    if (!ledger?.id) return;
    this.ledgerStore.setSelectedItem(ledger);
    void this.router.navigate(['/app/accounting/ledger', ledger.id, 'delete'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected viewLedgerCategory(row: LedgerTreeRow): void {
    const categoryId = this.categoryIdFromRow(row);
    if (!categoryId) return;
    void this.router.navigate(['/app/accounting/ledger-category', categoryId], {
      queryParams: { burl: this.router.url },
    });
  }

  protected editLedgerCategory(row: LedgerTreeRow): void {
    const categoryId = this.categoryIdFromRow(row);
    if (!categoryId) return;
    void this.router.navigate(['/app/accounting/ledger-category', categoryId, 'edit'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected deleteLedgerCategory(row: LedgerTreeRow): void {
    const categoryId = this.categoryIdFromRow(row);
    if (!categoryId) return;
    void this.router.navigate(['/app/accounting/ledger-category', categoryId, 'delete'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected readonly getTreeRowKey = (row: LedgerTreeRow): string => row.key;

  protected readonly getTreeRowChildren = (row: LedgerTreeRow): readonly LedgerTreeRow[] =>
    row.children;

  protected readonly getTreeRowClass = (row: LedgerTreeRow): string =>
    `ledger-tree-${row.kind}-row`;

  protected onExpandedKeysChange(keys: readonly unknown[]): void {
    this.expandedKeys.set(keys.filter((key): key is string => typeof key === 'string'));
  }

  private createCategoryRow(category: LedgerCategory): LedgerTreeRow {
    return {
      children: [],
      description: category.description ?? '',
      key: `category:${category.id}`,
      kind: 'category',
      name: category.name,
      openingcr: 0,
      openingdr: 0,
    };
  }

  private createLedgerRow(ledger: Ledger): LedgerTreeRow {
    return {
      children: [],
      description: ledger.description ?? '',
      key: `ledger:${ledger.id}`,
      kind: 'ledger',
      name: ledger.name,
      openingcr: toAmount(ledger.openingcr),
      openingdr: toAmount(ledger.openingdr),
    };
  }

  private findLedger(row: LedgerTreeRow): Ledger | undefined {
    if (row.kind !== 'ledger') return undefined;
    const ledgerId = row.key.startsWith('ledger:') ? row.key.slice('ledger:'.length) : null;
    if (!ledgerId) return undefined;
    return this.ledgerStore.catalog().find((ledger) => ledger.id === ledgerId);
  }

  private categoryIdFromRow(row: LedgerTreeRow): string | null {
    if (row.kind !== 'category') return null;
    if (!row.key.startsWith('category:')) return null;
    const categoryId = row.key.slice('category:'.length);
    return categoryId && categoryId !== 'uncategorized' ? categoryId : null;
  }

  private shouldHideBranchOpening(row: LedgerTreeRow): boolean {
    return row.kind === 'category' && row.children.length > 0 && this.expandedKeySet().has(row.key);
  }

  private rollUpOpeningAmounts(row: LedgerTreeRow): { openingcr: number; openingdr: number } {
    if (row.kind === 'ledger') {
      return { openingcr: row.openingcr, openingdr: row.openingdr };
    }

    let openingcr = 0;
    let openingdr = 0;
    for (const child of row.children) {
      const childTotals = this.rollUpOpeningAmounts(child);
      openingcr += childTotals.openingcr;
      openingdr += childTotals.openingdr;
    }

    row.openingcr = openingcr;
    row.openingdr = openingdr;
    return { openingcr, openingdr };
  }

  private async loadReferenceData(): Promise<void> {
    await Promise.all([this.loadLedgerCategories(), this.loadLedgers()]);
  }

  private async loadLedgerCategories(): Promise<void> {
    await this.ledgerCategoryStore.ensureLedgerCategoryCatalogLoaded();
  }

  private async loadLedgers(): Promise<void> {
    await this.ledgerStore.ensureLedgerCatalogLoaded();
  }
}
