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
import { BulkUploadButtonComponent } from '../../../../../../shared/bulk-upload';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { EmptyStateComponent } from '../../../../../../shared/empty-state';
import { TableRowIconButtonComponent } from '../../../../../../shared/table-row-icon-button';
import {
  LEDGER_CATEGORY_FILTER_TYPES,
  LedgerCategoryStore,
} from '../../../data/ledger-category';
import type { LedgerCategory } from '../../../data/ledger-category';

@Component({
  selector: 'app-list-ledger-category',
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
    BulkUploadButtonComponent,
  ],
  templateUrl: './list-ledger-category.component.html',
  styleUrl: './list-ledger-category.component.css',
  providers: [CrudListQueryService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListLedgerCategoryComponent {
  private readonly router = inject(Router);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly ledgerCategoryStore = inject(LedgerCategoryStore);
  protected readonly hasError = computed(() => this.ledgerCategoryStore.error() !== null);

  protected readonly columns: readonly TngTableColumn<LedgerCategory>[] = [
    { id: 'name', label: 'Name', sortable: true, width: '14rem' },
    { id: 'type', label: 'Type', sortable: true, width: '10rem' },
    { id: 'parent', label: 'Parent Category', width: '14rem' },
    { id: 'description', label: 'Description', sortable: true, truncate: true },
    { id: 'actions', label: 'Actions', align: 'end', headerAlign: 'end', width: '8rem' },
  ];

  protected readonly filterFields: readonly CrudFilterField[] = [
    { id: 'name', label: 'Name', placeholder: 'Category name', type: 'text' },
    {
      id: 'props.type',
      label: 'Type',
      options: LEDGER_CATEGORY_FILTER_TYPES.map((type) => ({
        label: type === 'Equity' ? 'Equity (legacy)' : type,
        value: type,
      })),
      placeholder: 'Any type',
      type: 'enum',
    },
    { id: 'description', label: 'Description', placeholder: 'Description text', type: 'text' },
  ];

  constructor() {
    this.crudQuery.init(
      (filter) =>
        void this.ledgerCategoryStore.loadLedgerCategories({ ...filter, includes: ['parent'] }),
    );
  }

  protected createLedgerCategory(): void {
    void this.router.navigate(['/app/accounting/ledger-category/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected viewLedgerCategory(item: LedgerCategory): void {
    if (item.id) {
      void this.router.navigate(['/app/accounting/ledger-category', item.id], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected editLedgerCategory(item: LedgerCategory): void {
    if (item.id) {
      void this.router.navigate(['/app/accounting/ledger-category', item.id, 'edit'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected deleteLedgerCategory(item: LedgerCategory): void {
    if (item.id) {
      void this.router.navigate(['/app/accounting/ledger-category', item.id, 'delete'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected openLedgers(): void {
    void this.router.navigate(['/app/accounting/ledger']);
  }

  protected reloadLedgerCategories(): void {
    void this.ledgerCategoryStore.refreshLedgerCategories({
      ...this.crudQuery.filter(),
      includes: ['parent'],
    });
  }
}
