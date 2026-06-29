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
import { CanDirective } from '../../../../../../core/permissions/can.directive';
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
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { EmptyStateComponent } from '../../../../../../shared/empty-state';
import { TableRowIconButtonComponent } from '../../../../../../shared/table-row-icon-button';
import {
  XlsxExportButtonComponent,
  columnsFromTable,
  createCrudListXlsxDocument,
  text,
} from '../../../../../../shared/xlsx-export';
import { ItemCategoryService, ItemCategoryStore } from '../../../data/item-category';
import type { ItemCategory } from '../../../data/item-category';

import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
@Component({
  selector: 'app-list-item-category',
  standalone: true,
  imports: [
    CanDirective,
    PageHeadingComponent,
    BurlBackButtonComponent,
    TngButtonComponent,
    TngCardComponent,
    CrudFilterPopoverComponent,
    CrudPaginatorComponent,
    TngIcon,
    EmptyStateComponent,
    TngTable,
    TngTableCellTpl,
    TableRowIconButtonComponent,
    BulkUploadButtonComponent,
    XlsxExportButtonComponent,
  ],
  templateUrl: './list-item-category.component.html',
  styleUrl: './list-item-category.component.css',
  providers: [CrudListQueryService],
})
export class ListItemCategoryComponent {
  private readonly router = inject(Router);
  private readonly itemCategoryService = inject(ItemCategoryService);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly itemCategoryStore = inject(ItemCategoryStore);
  protected readonly hasError = computed(() => this.itemCategoryStore.error() !== null);

  protected readonly bulkUploadConfig: BulkUploadPreviewConfig = {
    modelName: 'Item Categories',
    requiredPaths: ['name', 'code', 'type'],
    rootKey: 'itemCategory',
    sampleRows: [
      {
        name: 'Electronics',
        code: 'ELEC',
        type: 'Product',
        description: 'Electronic goods',
        parent: '',
        taxgroup: '',
      },
    ],
    xlsxColumns: [
      { header: 'Name', path: 'name' },
      { header: 'Code', path: 'code' },
      { header: 'Type', path: 'type' },
      { header: 'Parent', path: 'parent' },
      { header: 'Tax Group', path: 'taxgroup' },
      { header: 'Description', path: 'description' },
    ],
    xlsxSheetName: 'Item Categories',
    columns: [
      bulkUploadTextColumn('name', 'Name', 'name', '12rem'),
      bulkUploadTextColumn('code', 'Code', 'code', '8rem'),
      bulkUploadTextColumn('type', 'Type', 'type', '8rem'),
      bulkUploadTextColumn('parent', 'Parent', 'parent', '12rem'),
      bulkUploadTextColumn('taxgroup', 'Tax group', 'taxgroup', '12rem'),
      bulkUploadNamesColumn('description', 'Description', 'description'),
    ],
  };

  protected readonly columns: readonly TngTableColumn<ItemCategory>[] = [
    { id: 'name', label: 'Name', sortable: true, width: '14rem' },
    { id: 'code', label: 'Code', sortable: true, width: '9rem' },
    { id: 'type', label: 'Type', sortable: true, width: '9rem' },
    { id: 'parent', label: 'Parent Category', width: '13rem' },
    { id: 'description', label: 'Description', sortable: true, truncate: true },
    { id: 'actions', label: 'Actions', align: 'end', headerAlign: 'end', width: '8rem' },
  ];

  protected readonly filterFields: readonly CrudFilterField[] = [
    { id: 'name', label: 'Name', placeholder: 'Category name', type: 'text' },
    { id: 'code', label: 'Code', placeholder: 'Category code', type: 'text' },
    {
      id: 'type',
      label: 'Type',
      options: [
        { label: 'Product', value: 'Product' },
        { label: 'Service', value: 'Service' },
      ],
      placeholder: 'Any type',
      type: 'enum',
    },
    { id: 'description', label: 'Description', placeholder: 'Description', type: 'text' },
  ];

  constructor() {
    this.crudQuery.init(
      (filter) =>
        void this.itemCategoryStore.loadItemCategories({ ...filter, includes: ['parent'] }),
    );
  }

  protected readonly exportItemCategories = () =>
    createCrudListXlsxDocument({
      cachedRows: this.itemCategoryStore.items(),
      cachedTotal: this.itemCategoryStore.count(),
      columns: columnsFromTable(this.columns),
      count: (query) => this.itemCategoryService.count(query),
      fileNameBase: 'item-categories',
      list: (query) => this.itemCategoryService.list({ ...query, includes: ['parent'] }),
      mapRow: (category) => [
        text(category.name),
        text(category.code),
        text(category.type),
        text(category.parent?.name ?? category.parentid),
        text(category.description),
      ],
      query: this.crudQuery.filter(),
      sheetName: 'Item Categories',
      title: 'Item Categories',
    });

  protected createItemCategory(): void {
    void this.router.navigate(['/app/trading/item-category/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected openItems(): void {
    void this.router.navigate(['/app/trading/item']);
  }

  protected reloadItemCategories(): void {
    void this.itemCategoryStore.loadItemCategories({
      ...this.crudQuery.filter(),
      includes: ['parent'],
    });
  }

  protected viewItemCategory(item: ItemCategory): void {
    if (item.id) {
      this.itemCategoryStore.setSelectedItem(item);
      void this.router.navigate(['/app/trading/item-category', item.id], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected editItemCategory(item: ItemCategory): void {
    if (item.id) {
      this.itemCategoryStore.setSelectedItem(item);
      void this.router.navigate(['/app/trading/item-category', item.id, 'edit'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected deleteItemCategory(item: ItemCategory): void {
    if (item.id) {
      this.itemCategoryStore.setSelectedItem(item);
      void this.router.navigate(['/app/trading/item-category', item.id, 'delete'], {
        queryParams: { burl: this.router.url },
      });
    }
  }
}
