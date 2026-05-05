import { Component, OnInit, computed, inject } from '@angular/core';
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
import { ItemCategoryStore } from '../../../data/item-category';
import type { ItemCategory } from '../../../data/item-category';

@Component({
  selector: 'app-list-item-category',
  standalone: true,
  imports: [
    TngButtonComponent,
    TngCardComponent,
    CrudFilterPopoverComponent,
    CrudPaginatorComponent,
    TngIcon,
    TngTable,
    TngTableCellTpl,
  ],
  templateUrl: './list-item-category.component.html',
  styleUrl: './list-item-category.component.css',
  providers: [CrudListQueryService],
})
export class ListItemCategoryComponent implements OnInit {
  private readonly router = inject(Router);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly itemCategoryStore = inject(ItemCategoryStore);
  protected readonly hasError = computed(() => this.itemCategoryStore.error() !== null);

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

  ngOnInit(): void {
    this.crudQuery.init((filter) =>
      void this.itemCategoryStore.loadItemCategories({ ...filter, includes: ['parent'] }),
    );
  }

  protected createItemCategory(): void {
    void this.router.navigate(['/app/trading/item-category/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected openItems(): void {
    void this.router.navigate(['/app/trading/item']);
  }

  protected viewItemCategory(item: ItemCategory): void {
    if (item.id) {
      void this.router.navigate(['/app/trading/item-category', item.id], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected editItemCategory(item: ItemCategory): void {
    if (item.id) {
      void this.router.navigate(['/app/trading/item-category', item.id, 'edit'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected deleteItemCategory(item: ItemCategory): void {
    if (item.id) {
      void this.router.navigate(['/app/trading/item-category', item.id, 'delete'], {
        queryParams: { burl: this.router.url },
      });
    }
  }
}
