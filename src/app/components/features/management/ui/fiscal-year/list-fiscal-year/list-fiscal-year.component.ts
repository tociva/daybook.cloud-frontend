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
import { CanDirective } from '../../../../../../core/permissions/can.directive';
import {
  CrudFilterPopoverComponent,
  CrudListQueryService,
  CrudPaginatorComponent,
} from '../../../../../../shared/crud';
import type { CrudFilterField } from '../../../../../../shared/crud';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { EmptyStateComponent } from '../../../../../../shared/empty-state';
import { TableRowIconButtonComponent } from '../../../../../../shared/table-row-icon-button';
import {
  XlsxExportButtonComponent,
  columnsFromTable,
  createCrudListXlsxDocument,
  date,
  text,
} from '../../../../../../shared/xlsx-export';
import { FiscalYearService, FiscalYearStore } from '../../../data/fiscal-year';
import type { FiscalYear } from '../../../data/fiscal-year';
import { DateManagementService } from '../../../../../../core/date/date-management.service';

import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
@Component({
  selector: 'app-list-fiscal-year',
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
    XlsxExportButtonComponent,
  ],
  templateUrl: './list-fiscal-year.component.html',
  styleUrl: './list-fiscal-year.component.css',
  providers: [CrudListQueryService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListFiscalYearComponent {
  private readonly router = inject(Router);
  private readonly dateManagement = inject(DateManagementService);
  private readonly fiscalYearService = inject(FiscalYearService);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly fiscalYearStore = inject(FiscalYearStore);
  protected readonly hasError = computed(() => this.fiscalYearStore.error() !== null);
  protected readonly formatDate = (value: string | null | undefined): string =>
    this.dateManagement.formatDisplayDate(value);

  protected readonly columns: readonly TngTableColumn<FiscalYear>[] = [
    { id: 'name', label: 'Name', sortable: true, width: '14rem' },
    { id: 'startdate', label: 'Start Date', sortable: true, width: '10rem' },
    { id: 'enddate', label: 'End Date', sortable: true, width: '10rem' },
    { id: 'currencycode', label: 'Currency', sortable: true, width: '14rem' },
    { id: 'actions', label: 'Actions', align: 'end', headerAlign: 'end', width: '8rem' },
  ];

  protected readonly filterFields: readonly CrudFilterField[] = [
    { id: 'name', label: 'Name', placeholder: 'Fiscal year name', type: 'text' },
    { id: 'currencycode', label: 'Currency', placeholder: 'e.g. INR', type: 'text' },
  ];

  constructor() {
    this.crudQuery.init((filter) =>
      void this.fiscalYearStore.loadFiscalYears({
        ...filter,
        includes: ['currency'],
        order: filter.order?.length ? filter.order : ['startdate ASC'],
      }),
    );
  }

  protected readonly exportFiscalYears = () =>
    createCrudListXlsxDocument({
      cachedRows: this.fiscalYearStore.items(),
      cachedTotal: this.fiscalYearStore.count(),
      columns: columnsFromTable(this.columns),
      count: (query) => this.fiscalYearService.count(query),
      fileNameBase: 'fiscal-years',
      list: (query) =>
        this.fiscalYearService.list({
          ...query,
          includes: ['currency'],
          order: query.order?.length ? query.order : ['startdate ASC'],
        }),
      mapRow: (fiscalYear) => [
        text(fiscalYear.name),
        date(fiscalYear.startdate),
        date(fiscalYear.enddate),
        text(fiscalYear.currencycode),
      ],
      query: this.crudQuery.filter(),
      sheetName: 'Fiscal Years',
      title: 'Fiscal Years',
    });

  protected createFiscalYear(): void {
    void this.router.navigate(['/app/management/fiscal-year/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected viewFiscalYear(item: FiscalYear): void {
    if (item.id) {
      void this.router.navigate(['/app/management/fiscal-year', item.id], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected editFiscalYear(item: FiscalYear): void {
    if (item.id) {
      void this.router.navigate(['/app/management/fiscal-year', item.id, 'edit'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected deleteFiscalYear(item: FiscalYear): void {
    if (item.id) {
      void this.router.navigate(['/app/management/fiscal-year', item.id, 'delete'], {
        queryParams: { burl: this.router.url },
      });
    }
  }
}
