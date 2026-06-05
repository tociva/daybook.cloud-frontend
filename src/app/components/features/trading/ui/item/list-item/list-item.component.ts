import { Component, computed, inject } from '@angular/core';
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
import {
  bulkUploadNamesColumn,
  BulkUploadButtonComponent,
  bulkUploadTextColumn,
} from '../../../../../../shared/bulk-upload';
import type { BulkUploadPreviewConfig } from '../../../../../../shared/bulk-upload';
import { EmptyStateComponent } from '../../../../../../shared/empty-state';
import { TableRowIconButtonComponent } from '../../../../../../shared/table-row-icon-button';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { ItemStore } from '../../../data/item';
import type { Item } from '../../../data/item';

@Component({
  selector: 'app-list-item',
  imports: [
    EmptyStateComponent,
    PageHeadingComponent,
    TngButtonComponent,
    TngCardComponent,
    CrudFilterPopoverComponent,
    CrudPaginatorComponent,
    TngIcon,
    TngTable,
    TngTableCellTpl,
    TableRowIconButtonComponent,
    BulkUploadButtonComponent,
  ],
  templateUrl: './list-item.component.html',
  styleUrl: './list-item.component.css',
  providers: [CrudListQueryService],
})
export class ListItemComponent {
  private readonly router = inject(Router);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly itemStore = inject(ItemStore);
  protected readonly hasError = computed(() => this.itemStore.error() !== null);

  protected readonly bulkUploadConfig: BulkUploadPreviewConfig = {
    modelName: 'Items',
    requiredPaths: ['name', 'code', 'displayname', 'category'],
    rootKey: 'items',
    sampleRows: [
      {
        name: 'Laptop',
        code: 'LAP-001',
        displayname: 'Laptop',
        barcode: '890000000001',
        description: 'Business laptop',
        purchaseledger: 'Purchase Account',
        salesledger: 'Sales Account',
        category: 'Electronics',
      },
    ],
    xlsxColumns: [
      { header: 'Name', path: 'name' },
      { header: 'Code', path: 'code' },
      { header: 'Display Name', path: 'displayname' },
      { header: 'Category', path: 'category' },
      { header: 'Barcode', path: 'barcode' },
      { header: 'Description', path: 'description' },
      { header: 'Purchase Ledger', path: 'purchaseledger' },
      { header: 'Sales Ledger', path: 'salesledger' },
    ],
    xlsxSheetName: 'Items',
    columns: [
      bulkUploadTextColumn('name', 'Name', 'name', '12rem'),
      bulkUploadTextColumn('code', 'Code', 'code', '8rem'),
      bulkUploadTextColumn('displayname', 'Display name', 'displayname', '12rem'),
      bulkUploadTextColumn('category', 'Category', 'category', '12rem'),
      bulkUploadTextColumn('barcode', 'Barcode', 'barcode', '10rem'),
      bulkUploadNamesColumn('description', 'Description', 'description'),
    ],
  };

  protected readonly columns: readonly TngTableColumn<Item>[] = [
    { id: 'name', label: 'Name', sortable: true, width: '14rem' },
    { id: 'code', label: 'Code', sortable: true, width: '9rem' },
    { id: 'displayname', label: 'Display Name', sortable: true, width: '12rem' },
    { id: 'category', label: 'Category', width: '12rem' },
    { id: 'barcode', label: 'Barcode', sortable: true, width: '10rem' },
    { id: 'description', label: 'Description', sortable: true, truncate: true },
    { id: 'actions', label: 'Actions', align: 'end', headerAlign: 'end', width: '8rem' },
  ];

  protected readonly filterFields: readonly CrudFilterField[] = [
    { id: 'name', label: 'Name', placeholder: 'Item name', type: 'text' },
    { id: 'code', label: 'Code', placeholder: 'Item code', type: 'text' },
    { id: 'displayname', label: 'Display Name', placeholder: 'Display name', type: 'text' },
    { id: 'barcode', label: 'Barcode', placeholder: 'Barcode', type: 'text' },
    { id: 'description', label: 'Description', placeholder: 'Description', type: 'text' },
  ];

  constructor() {
    this.crudQuery.init(
      (filter) => void this.itemStore.loadItems({ ...filter, includes: ['category'] }),
    );
  }

  protected createItem(): void {
    void this.router.navigate(['/app/trading/item/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected openItemCategories(): void {
    void this.router.navigate(['/app/trading/item-category']);
  }

  protected showAllItems(): void {
    void this.router.navigate(['/app/trading/item/tree-view']);
  }

  protected reloadItems(): void {
    void this.itemStore.loadItems({ ...this.crudQuery.filter(), includes: ['category'] });
  }

  protected viewItem(item: Item): void {
    if (item.id) {
      this.itemStore.setSelectedItem(item);
      void this.router.navigate(['/app/trading/item', item.id], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected editItem(item: Item): void {
    if (item.id) {
      this.itemStore.setSelectedItem(item);
      void this.router.navigate(['/app/trading/item', item.id, 'edit'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected deleteItem(item: Item): void {
    if (item.id) {
      this.itemStore.setSelectedItem(item);
      void this.router.navigate(['/app/trading/item', item.id, 'delete'], {
        queryParams: { burl: this.router.url },
      });
    }
  }
}
