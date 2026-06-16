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
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { EmptyStateComponent } from '../../../../../../shared/empty-state';
import { formatAmountWithCurrency } from '../../../../../../shared/format/currency';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { TableRowIconButtonComponent } from '../../../../../../shared/table-row-icon-button';
import {
  CrudFilterPopoverComponent,
  CrudListQueryService,
  CrudPaginatorComponent,
} from '../../../../../../shared/crud';
import type { CrudFilterField, Lb4ListQuery } from '../../../../../../shared/crud';
import { ContraTransactionStore } from '../../../data/contra-transaction';
import type { ContraTransaction } from '../../../data/contra-transaction';

@Component({
  selector: 'app-list-bank-contra',
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
  ],
  templateUrl: './list-bank-contra.component.html',
  styleUrl: './list-bank-contra.component.css',
  providers: [CrudListQueryService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListBankContraComponent {
  private readonly dateManagement = inject(DateManagementService);
  private readonly router = inject(Router);
  protected readonly contraTransactionStore = inject(ContraTransactionStore);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly hasError = computed(() => this.contraTransactionStore.error() !== null);

  protected readonly columns: readonly TngTableColumn<ContraTransaction>[] = [
    { id: 'date', label: 'Date', sortable: true, width: '10rem' },
    { id: 'frombcash', label: 'From', width: '14rem' },
    { id: 'tobcash', label: 'To', width: '14rem' },
    {
      id: 'amount',
      label: 'Amount',
      sortable: true,
      align: 'end',
      headerAlign: 'end',
      width: '12rem',
    },
    { id: 'description', label: 'Description', truncate: true },
    { id: 'actions', label: 'Actions', align: 'end', headerAlign: 'end', width: '10rem' },
  ];

  protected readonly filterFields: readonly CrudFilterField[] = [
    { id: 'date', label: 'Date', defaultOperator: 'between', type: 'date' },
    { id: 'description', label: 'Description', placeholder: 'Search description', type: 'text' },
  ];

  constructor() {
    this.crudQuery.init((filter) => this.loadContraTransactions(filter));
  }

  protected formatDate(value: string | undefined): string {
    return this.dateManagement.formatDisplayDate(value, '-');
  }

  protected formatAmount(row: ContraTransaction): string {
    return formatAmountWithCurrency(row.amount, row.currencycode);
  }

  protected createContra(): void {
    void this.router.navigate(['/app/trading/bank-cash/contra/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected reloadContraTransactions(): void {
    void this.loadContraTransactions(this.crudQuery.filter());
  }

  protected viewContra(item: ContraTransaction): void {
    if (!item.id) return;
    this.contraTransactionStore.setSelectedItem(item);
    void this.router.navigate(['/app/trading/bank-cash/contra', item.id], {
      queryParams: { burl: this.router.url },
    });
  }

  protected editContra(item: ContraTransaction): void {
    if (!item.id) return;
    this.contraTransactionStore.setSelectedItem(item);
    void this.router.navigate(['/app/trading/bank-cash/contra', item.id, 'edit'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected deleteContra(item: ContraTransaction): void {
    if (!item.id) return;
    this.contraTransactionStore.setSelectedItem(item);
    void this.router.navigate(['/app/trading/bank-cash/contra', item.id, 'delete'], {
      queryParams: { burl: this.router.url },
    });
  }

  private async loadContraTransactions(filter: Lb4ListQuery): Promise<void> {
    await this.contraTransactionStore.loadContraTransactions({
      ...filter,
      includes: ['frombcash', 'tobcash'],
    });
  }
}
