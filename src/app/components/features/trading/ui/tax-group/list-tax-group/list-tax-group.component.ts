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
  bulkUploadCountColumn,
  bulkUploadNamesColumn,
  bulkUploadNumberColumn,
  BulkUploadButtonComponent,
  bulkUploadTextColumn,
} from '../../../../../../shared/bulk-upload';
import type { BulkUploadPreviewConfig } from '../../../../../../shared/bulk-upload';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { EmptyStateComponent } from '../../../../../../shared/empty-state';
import { TableRowIconButtonComponent } from '../../../../../../shared/table-row-icon-button';
import { TaxGroupStore } from '../../../data/tax-group';
import type { TaxGroup } from '../../../data/tax-group';

@Component({
  selector: 'app-list-tax-group',
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
  templateUrl: './list-tax-group.component.html',
  styleUrl: './list-tax-group.component.css',
  providers: [CrudListQueryService],
})
export class ListTaxGroupComponent {
  private readonly router = inject(Router);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly taxGroupStore = inject(TaxGroupStore);
  protected readonly hasError = computed(() => this.taxGroupStore.error() !== null);

  protected readonly bulkUploadConfig: BulkUploadPreviewConfig = {
    modelName: 'Tax Groups',
    requiredPaths: ['name', 'rate'],
    rootKey: 'taxgroups',
    sampleRows: [
      {
        name: 'GST 18%',
        rate: 18,
        description: 'CGST + SGST',
        groups: [{ mode: 'intra-state', taxes: ['CGST 9%', 'SGST 9%'] }],
      },
    ],
    xlsxColumns: [
      { header: 'Name', path: 'name' },
      { header: 'Rate', path: 'rate' },
      { header: 'Description', path: 'description' },
      { header: 'Groups', path: 'groups' },
    ],
    xlsxSheetName: 'Tax Groups',
    columns: [
      bulkUploadTextColumn('name', 'Name', 'name', '14rem'),
      bulkUploadNumberColumn('rate', 'Rate', 'rate', '7rem'),
      bulkUploadCountColumn('groups', 'Groups', 'groups', '7rem'),
      bulkUploadNamesColumn('description', 'Description', 'description'),
    ],
  };

  protected readonly columns: readonly TngTableColumn<TaxGroup>[] = [
    { id: 'name', label: 'Name', sortable: true, width: '16rem' },
    { id: 'rate', label: 'Rate (%)', sortable: true, width: '8rem' },
    { id: 'description', label: 'Description', sortable: true, truncate: true },
    { id: 'actions', label: 'Actions', align: 'end', headerAlign: 'end', width: '8rem' },
  ];
  protected readonly filterFields: readonly CrudFilterField[] = [
    { id: 'name', label: 'Name', placeholder: 'Tax group name', type: 'text' },
    { id: 'description', label: 'Description', placeholder: 'Description', type: 'text' },
  ];

  constructor() {
    this.crudQuery.init((filter) => void this.taxGroupStore.loadTaxGroups(filter));
  }

  protected createTaxGroup(): void {
    void this.router.navigate(['/app/trading/tax-group/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected openTaxes(): void {
    void this.router.navigate(['/app/trading/tax']);
  }

  protected reloadTaxGroups(): void {
    void this.taxGroupStore.loadTaxGroups(this.crudQuery.filter());
  }

  protected viewTaxGroup(item: TaxGroup): void {
    if (item.id) {
      this.taxGroupStore.setSelectedItem(item);
      void this.router.navigate(['/app/trading/tax-group', item.id], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected editTaxGroup(item: TaxGroup): void {
    if (item.id) {
      this.taxGroupStore.setSelectedItem(item);
      void this.router.navigate(['/app/trading/tax-group', item.id, 'edit'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected deleteTaxGroup(item: TaxGroup): void {
    if (item.id) {
      this.taxGroupStore.setSelectedItem(item);
      void this.router.navigate(['/app/trading/tax-group', item.id, 'delete'], {
        queryParams: { burl: this.router.url },
      });
    }
  }
}
