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
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { formatAmountWithCurrency } from '../../../../../../shared/format/currency';
import { CustomerReceiptStore } from '../../../data/customer-receipt';
import type { CustomerReceipt } from '../../../data/customer-receipt';

@Component({
  selector: 'app-list-customer-receipt',
  standalone: true,
  imports: [
    PageHeadingComponent,
    TngButtonComponent,
    TngCardComponent,
    CrudFilterPopoverComponent,
    CrudPaginatorComponent,
    TngIcon,
    TngTable,
    TngTableCellTpl,
  ],
  templateUrl: './list-customer-receipt.component.html',
  styleUrl: './list-customer-receipt.component.css',
  providers: [CrudListQueryService],
})
export class ListCustomerReceiptComponent {
  private readonly router = inject(Router);
  private readonly dateManagement = inject(DateManagementService);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly customerReceiptStore = inject(CustomerReceiptStore);
  protected readonly hasError = computed(() => this.customerReceiptStore.error() !== null);

  protected readonly columns: readonly TngTableColumn<CustomerReceipt>[] = [
    { id: 'date', label: 'Date', sortable: true, width: '10rem' },
    { id: 'customer', label: 'Customer', width: '14rem' },
    {
      id: 'amount',
      label: 'Amount',
      sortable: true,
      align: 'end',
      headerAlign: 'end',
      width: '12rem',
    },
    { id: 'bcash', label: 'Bank/Cash', width: '12rem' },
    { id: 'description', label: 'Description', width: '16rem' },
    { id: 'actions', label: 'Actions', align: 'end', headerAlign: 'end', width: '8rem' },
  ];

  protected readonly filterFields: readonly CrudFilterField[] = [
    { id: 'description', label: 'Description', placeholder: 'Search description', type: 'text' },
  ];

  protected formatDate(value: string | undefined): string {
    return this.dateManagement.formatDisplayDate(value, '—');
  }

  protected readonly formatAmountWithCurrency = formatAmountWithCurrency;

  constructor() {
    this.crudQuery.init(
      (filter) =>
        void this.customerReceiptStore.loadCustomerReceipts({
          ...filter,
          includes: ['customer', 'bcash'],
        }),
    );
  }

  protected createReceipt(): void {
    void this.router.navigate(['/app/trading/customer-receipt/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected editReceipt(item: CustomerReceipt): void {
    if (item.id) {
      void this.router.navigate(['/app/trading/customer-receipt', item.id, 'edit'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected deleteReceipt(item: CustomerReceipt): void {
    if (item.id) {
      void this.router.navigate(['/app/trading/customer-receipt', item.id, 'delete'], {
        queryParams: { burl: this.router.url },
      });
    }
  }
}
