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
import { ItemCategoryStore } from '../../../data/item-category';
import type { ItemCategory } from '../../../data/item-category';
import { ItemStore } from '../../../data/item';
import type { Item } from '../../../data/item';

type ItemTreeRow = {
  children: ItemTreeRow[];
  code: string;
  description: string;
  displayname: string;
  key: string;
  kind: 'category' | 'item';
  name: string;
  type: string;
};

const catalogPageSize = 1000;
const softColumnBorder =
  '1px solid color-mix(in srgb, var(--tng-semantic-border-subtle) 72%, var(--tng-semantic-foreground-muted) 28%)';

const rowNameClass = (row: ItemTreeRow): string =>
  `item-tree-name-cell item-tree-${row.kind}-cell`;

@Component({
  selector: 'app-tree-view-item',
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
  templateUrl: './tree-view-item.component.html',
  styleUrl: './tree-view-item.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeViewItemComponent implements OnInit {
  private readonly router = inject(Router);
  protected readonly itemStore = inject(ItemStore);
  protected readonly itemCategoryStore = inject(ItemCategoryStore);

  protected readonly expandedKeys = signal<readonly string[]>([]);
  protected readonly displayError = computed(
    () => this.itemCategoryStore.error() ?? this.itemStore.error(),
  );
  protected readonly hasError = computed(() => this.displayError() !== null);
  protected readonly isLoading = computed(
    () => this.itemCategoryStore.isLoading() || this.itemStore.isLoading(),
  );

  protected readonly treeData = computed<readonly ItemTreeRow[]>(() => {
    const categories = this.itemCategoryStore.items();
    const items = this.itemStore.catalog();
    const categoryNodes = new Map<string, ItemTreeRow>();
    const categoriesById = new Map<string, ItemCategory>();
    const rootRows: ItemTreeRow[] = [];

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

    const uncategorizedItems: ItemTreeRow[] = [];
    for (const item of items) {
      if (!item.id) continue;
      const categoryId = item.categoryid ?? item.category?.id ?? null;
      const category = categoryId ? categoriesById.get(categoryId) ?? item.category : undefined;
      const categoryNode = category?.id ? categoryNodes.get(category.id) : null;
      const row = this.createItemRow(item);

      if (categoryNode) {
        categoryNode.children.push(row);
      } else {
        uncategorizedItems.push(row);
      }
    }

    if (uncategorizedItems.length > 0) {
      rootRows.push({
        children: uncategorizedItems,
        code: '',
        description: '',
        displayname: '',
        key: 'category:uncategorized',
        kind: 'category',
        name: 'Uncategorized',
        type: '',
      });
    }

    return rootRows;
  });

  private readonly expandableTreeKeys = computed(() => {
    const keys: string[] = [];
    const collect = (rows: readonly ItemTreeRow[]): void => {
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

  protected readonly columns: readonly TngTreeTableColumn<ItemTreeRow>[] = [
    {
      key: 'name',
      label: 'Item Category / Item',
      treeToggle: true,
      width: '22rem',
      cellClass: rowNameClass,
      headerStyle: {
        'border-inline-end': softColumnBorder,
      },
      cellStyle: {
        'border-inline-end': softColumnBorder,
      },
    },
    {
      key: 'code',
      label: 'Code',
      width: '10rem',
      headerStyle: {
        'border-inline-end': softColumnBorder,
      },
      cellStyle: {
        'border-inline-end': softColumnBorder,
      },
    },
    {
      key: 'type',
      label: 'Type / Display Name',
      width: '14rem',
      accessor: (row) => (row.kind === 'category' ? row.type : row.displayname),
      headerStyle: {
        'border-inline-end': softColumnBorder,
      },
      cellStyle: {
        'border-inline-end': softColumnBorder,
      },
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

  protected createItem(): void {
    void this.router.navigate(['/app/trading/item/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected createItemCategory(): void {
    void this.router.navigate(['/app/trading/item-category/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected onRefresh(): void {
    void this.loadReferenceData();
  }

  protected shouldShowRowActions(row: ItemTreeRow): boolean {
    return row.key !== 'category:uncategorized';
  }

  protected viewItem(row: ItemTreeRow): void {
    const item = this.findItem(row);
    if (!item?.id) return;
    this.itemStore.setSelectedItem(item);
    void this.router.navigate(['/app/trading/item', item.id], {
      queryParams: { burl: this.router.url },
    });
  }

  protected editItem(row: ItemTreeRow): void {
    const item = this.findItem(row);
    if (!item?.id) return;
    this.itemStore.setSelectedItem(item);
    void this.router.navigate(['/app/trading/item', item.id, 'edit'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected deleteItem(row: ItemTreeRow): void {
    const item = this.findItem(row);
    if (!item?.id) return;
    this.itemStore.setSelectedItem(item);
    void this.router.navigate(['/app/trading/item', item.id, 'delete'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected viewItemCategory(row: ItemTreeRow): void {
    const categoryId = this.categoryIdFromRow(row);
    if (!categoryId) return;
    void this.router.navigate(['/app/trading/item-category', categoryId], {
      queryParams: { burl: this.router.url },
    });
  }

  protected editItemCategory(row: ItemTreeRow): void {
    const categoryId = this.categoryIdFromRow(row);
    if (!categoryId) return;
    void this.router.navigate(['/app/trading/item-category', categoryId, 'edit'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected deleteItemCategory(row: ItemTreeRow): void {
    const categoryId = this.categoryIdFromRow(row);
    if (!categoryId) return;
    void this.router.navigate(['/app/trading/item-category', categoryId, 'delete'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected readonly getTreeRowKey = (row: ItemTreeRow): string => row.key;

  protected readonly getTreeRowChildren = (row: ItemTreeRow): readonly ItemTreeRow[] => row.children;

  protected readonly getTreeRowClass = (row: ItemTreeRow): string => `item-tree-${row.kind}-row`;

  protected onExpandedKeysChange(keys: readonly unknown[]): void {
    this.expandedKeys.set(keys.filter((key): key is string => typeof key === 'string'));
  }

  private createCategoryRow(category: ItemCategory): ItemTreeRow {
    return {
      children: [],
      code: category.code,
      description: category.description ?? '',
      displayname: '',
      key: `category:${category.id}`,
      kind: 'category',
      name: category.name,
      type: category.type,
    };
  }

  private createItemRow(item: Item): ItemTreeRow {
    return {
      children: [],
      code: item.code,
      description: item.description ?? '',
      displayname: item.displayname,
      key: `item:${item.id}`,
      kind: 'item',
      name: item.name,
      type: '',
    };
  }

  private findItem(row: ItemTreeRow): Item | undefined {
    if (row.kind !== 'item') return undefined;
    const itemId = row.key.startsWith('item:') ? row.key.slice('item:'.length) : null;
    if (!itemId) return undefined;
    return this.itemStore.catalog().find((item) => item.id === itemId);
  }

  private categoryIdFromRow(row: ItemTreeRow): string | null {
    if (row.kind !== 'category') return null;
    if (!row.key.startsWith('category:')) return null;
    const categoryId = row.key.slice('category:'.length);
    return categoryId && categoryId !== 'uncategorized' ? categoryId : null;
  }

  private async loadReferenceData(): Promise<void> {
    await Promise.all([this.loadItemCategories(), this.loadItems()]);
  }

  private async loadItemCategories(): Promise<void> {
    const query = {
      includes: ['parent'],
      limit: catalogPageSize,
      offset: 0,
    };

    await this.itemCategoryStore.loadItemCategories(query);
    const count = this.itemCategoryStore.count();
    if (count > this.itemCategoryStore.items().length) {
      await this.itemCategoryStore.loadItemCategories({ ...query, limit: count });
    }
  }

  private async loadItems(): Promise<void> {
    await this.itemStore.ensureItemCatalogLoaded();
  }
}
