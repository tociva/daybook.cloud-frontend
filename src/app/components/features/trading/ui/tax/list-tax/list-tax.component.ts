import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  TngButtonComponent,
  TngCardComponent,
  TngTag,
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
import { TableRowIconButtonComponent } from '../../../../../../shared/table-row-icon-button';
import { Status, TaxStore } from '../../../data/tax';
import type { Tax } from '../../../data/tax';
import { TngTagIcon } from '../../bank-cash/tng-tag-icon.directive';

type StatusTagTone = 'danger' | 'success' | 'warning';

@Component({
  selector: 'app-list-tax',
  imports: [
    PageHeadingComponent,
    TngButtonComponent,
    TngCardComponent,
    CrudFilterPopoverComponent,
    CrudPaginatorComponent,
    TngIcon,
    TngTag,
    TngTagIcon,
    EmptyStateComponent,
    TngTable,
    TngTableCellTpl,
    TableRowIconButtonComponent,
    BulkUploadButtonComponent,
  ],
  templateUrl: './list-tax.component.html',
  styleUrl: './list-tax.component.css',
  providers: [CrudListQueryService],
})
export class ListTaxComponent {
  private readonly router = inject(Router);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly taxStore = inject(TaxStore);
  protected readonly hasError = computed(() => this.taxStore.error() !== null);

  protected readonly bulkUploadConfig: BulkUploadPreviewConfig = {
    modelName: 'Taxes',
    requiredPaths: ['name', 'shortname', 'rate', 'appliedto'],
    rootKey: 'taxes',
    sampleRows: [
      {
        name: 'CGST 9%',
        shortname: 'CGST',
        rate: 9,
        appliedto: 1,
        description: 'Central GST',
      },
    ],
    xlsxColumns: [
      { header: 'Name', path: 'name' },
      { header: 'Short Name', path: 'shortname' },
      { header: 'Rate', path: 'rate' },
      { header: 'Applied To', path: 'appliedto' },
      { header: 'Description', path: 'description' },
    ],
    xlsxSheetName: 'Taxes',
    columns: [
      bulkUploadTextColumn('name', 'Name', 'name', '14rem'),
      bulkUploadTextColumn('shortname', 'Short name', 'shortname', '9rem'),
      bulkUploadNumberColumn('rate', 'Rate', 'rate', '7rem'),
      bulkUploadNumberColumn('appliedto', 'Applied to', 'appliedto', '8rem'),
      bulkUploadNamesColumn('description', 'Description', 'description'),
    ],
  };

  protected readonly columns: readonly TngTableColumn<Tax>[] = [
    { id: 'name', label: 'Name', sortable: true, width: '14rem' },
    { id: 'shortname', label: 'Short Name', sortable: true, width: '10rem' },
    { id: 'rate', label: 'Rate (%)', sortable: true, width: '8rem' },
    { id: 'appliedto', label: 'Applied To', sortable: true, width: '9rem' },
    { id: 'status', label: 'Status', sortable: true, width: '9rem' },
    { id: 'description', label: 'Description', sortable: true, truncate: true },
    { id: 'actions', label: 'Actions', align: 'end', headerAlign: 'end', width: '8rem' },
  ];
  protected readonly filterFields: readonly CrudFilterField[] = [
    { id: 'name', label: 'Name', placeholder: 'Tax name', type: 'text' },
    { id: 'shortname', label: 'Short Name', placeholder: 'Short name', type: 'text' },
    { id: 'description', label: 'Description', placeholder: 'Description', type: 'text' },
    {
      id: 'status',
      label: 'Status',
      options: [
        { label: 'Active', value: Status.ACTIVE },
        { label: 'Inactive', value: Status.INACTIVE },
        { label: 'Deleted', value: Status.DELETED },
      ],
      placeholder: 'Any status',
      type: 'enum',
    },
  ];

  constructor() {
    this.crudQuery.init((filter) => void this.taxStore.loadTaxes(filter));
  }

  protected createTax(): void {
    void this.router.navigate(['/app/trading/tax/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected openTaxGroups(): void {
    void this.router.navigate(['/app/trading/tax-group']);
  }

  protected reloadTaxes(): void {
    void this.taxStore.loadTaxes(this.crudQuery.filter());
  }

  protected viewTax(item: Tax): void {
    if (item.id) {
      this.taxStore.setSelectedItem(item);
      void this.router.navigate(['/app/trading/tax', item.id], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected editTax(item: Tax): void {
    if (item.id) {
      this.taxStore.setSelectedItem(item);
      void this.router.navigate(['/app/trading/tax', item.id, 'edit'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected deleteTax(item: Tax): void {
    if (item.id) {
      this.taxStore.setSelectedItem(item);
      void this.router.navigate(['/app/trading/tax', item.id, 'delete'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected getStatusLabel(status: Tax['status']): string {
    switch (status) {
      case Status.INACTIVE:
        return 'Inactive';
      case Status.DELETED:
        return 'Deleted';
      case Status.ACTIVE:
      case undefined:
        return 'Active';
      default:
        return String(status);
    }
  }

  protected getStatusTone(status: Tax['status']): StatusTagTone {
    switch (status) {
      case Status.INACTIVE:
        return 'warning';
      case Status.DELETED:
        return 'danger';
      case Status.ACTIVE:
      case undefined:
      default:
        return 'success';
    }
  }
}
