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
import {
  bulkUploadNamesColumn,
  bulkUploadNumberColumn,
  BulkUploadButtonComponent,
  bulkUploadTextColumn,
} from '../../../../../../shared/bulk-upload';
import type { BulkUploadPreviewConfig } from '../../../../../../shared/bulk-upload';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { EmptyStateComponent } from '../../../../../../shared/empty-state';
import { LedgerStore } from '../../../data/ledger';
import type { Ledger } from '../../../data/ledger';

const openingHeaderBorder =
  '1px solid color-mix(in srgb, var(--tng-semantic-border-subtle) 70%, var(--tng-semantic-foreground-muted) 30%)';

@Component({
  selector: 'app-list-ledger',
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
    BulkUploadButtonComponent,
  ],
  templateUrl: './list-ledger.component.html',
  styleUrl: './list-ledger.component.css',
  providers: [CrudListQueryService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListLedgerComponent {
  private readonly router = inject(Router);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly ledgerStore = inject(LedgerStore);
  protected readonly hasError = computed(() => this.ledgerStore.error() !== null);

  protected readonly bulkUploadConfig: BulkUploadPreviewConfig = {
    modelName: 'Ledgers',
    requiredPaths: ['name', 'category'],
    rootKey: 'ledgers',
    sampleRows: [
      {
        name: 'HDFC Bank Ledger',
        category: 'Bank Accounts',
        openingdr: 0,
        openingcr: 0,
        description: 'Ledger for HDFC current account',
      },
    ],
    xlsxColumns: [
      { header: 'Name', path: 'name' },
      { header: 'Category', path: 'category' },
      { header: 'OpeningDr', path: 'openingdr' },
      { header: 'OpeningCr', path: 'openingcr' },
      { header: 'Description', path: 'description' },
    ],
    xlsxSheetName: 'Ledgers',
    columns: [
      bulkUploadTextColumn('name', 'Name', 'name', '14rem'),
      bulkUploadTextColumn('category', 'Category', 'category', '14rem'),
      bulkUploadNumberColumn('openingdr', 'Opening DR', 'openingdr', '10rem'),
      bulkUploadNumberColumn('openingcr', 'Opening CR', 'openingcr', '10rem'),
      bulkUploadNamesColumn('description', 'Description', 'description'),
    ],
  };

  protected readonly columns: readonly TngTableColumn<Ledger>[] = [
    {
      id: 'name',
      label: 'Name',
      sortable: true,
      width: '14rem',
      headerStyle: {
        'border-inline-end': openingHeaderBorder,
      },
    },
    { id: 'category', label: 'Category', width: '12rem' },
    {
      id: 'opening',
      label: 'Opening',
      headerAlign: 'center',
      headerStyle: {
        'border-block-end': '0',
        'border-inline-start': openingHeaderBorder,
        'border-inline-end': openingHeaderBorder,
      },
      children: [
        {
          id: 'openingdr',
          label: 'Debit',
          sortable: true,
          width: '10rem',
          align: 'end',
          headerAlign: 'end',
          headerStyle: {
            'border-inline-start': openingHeaderBorder,
          },
        },
        {
          id: 'openingcr',
          label: 'Credit',
          sortable: true,
          width: '10rem',
          align: 'end',
          headerAlign: 'end',
          headerStyle: {
            'border-inline-end': openingHeaderBorder,
          },
        },
      ],
    },
    {
      id: 'description',
      label: 'Description',
      sortable: true,
      truncate: true,
      headerStyle: {
        'border-inline-end': openingHeaderBorder,
      },
    },
    { id: 'actions', label: 'Actions', align: 'end', headerAlign: 'end', width: '8rem' },
  ];

  protected readonly filterFields: readonly CrudFilterField[] = [
    { id: 'name', label: 'Name', placeholder: 'Ledger name', type: 'text' },
    { id: 'description', label: 'Description', placeholder: 'Description text', type: 'text' },
  ];

  constructor() {
    this.crudQuery.init(
      (filter) => void this.ledgerStore.loadLedgers({ ...filter, includes: ['category'] }),
    );
  }

  protected createLedger(): void {
    void this.router.navigate(['/app/accounting/ledger/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected viewLedger(item: Ledger): void {
    if (item.id) {
      this.ledgerStore.setSelectedItem(item);
      void this.router.navigate(['/app/accounting/ledger', item.id], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected editLedger(item: Ledger): void {
    if (item.id) {
      this.ledgerStore.setSelectedItem(item);
      void this.router.navigate(['/app/accounting/ledger', item.id, 'edit'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected deleteLedger(item: Ledger): void {
    if (item.id) {
      this.ledgerStore.setSelectedItem(item);
      void this.router.navigate(['/app/accounting/ledger', item.id, 'delete'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected openLedgerCategories(): void {
    void this.router.navigate(['/app/accounting/ledger-category'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected reloadLedgers(): void {
    void this.ledgerStore.loadLedgers({ ...this.crudQuery.filter(), includes: ['category'] });
  }
}
