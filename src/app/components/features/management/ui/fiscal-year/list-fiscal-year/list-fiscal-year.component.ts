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
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { EmptyStateComponent } from '../../../../../../shared/empty-state';
import { FiscalYearStore } from '../../../data/fiscal-year';
import type { FiscalYear } from '../../../data/fiscal-year';
import { DateManagementService } from '../../../../../../core/date/date-management.service';

@Component({
  selector: 'app-list-fiscal-year',
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
  ],
  templateUrl: './list-fiscal-year.component.html',
  styleUrl: './list-fiscal-year.component.css',
  providers: [CrudListQueryService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListFiscalYearComponent {
  private readonly router = inject(Router);
  private readonly dateManagement = inject(DateManagementService);
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
      void this.fiscalYearStore.loadFiscalYears({ ...filter, includes: ['currency'] }),
    );
  }

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
