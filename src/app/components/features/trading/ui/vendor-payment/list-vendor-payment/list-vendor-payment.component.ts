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
import { VendorPaymentStore } from '../../../data/vendor-payment';
import type { VendorPayment } from '../../../data/vendor-payment';

@Component({
  selector: 'app-list-vendor-payment',
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
  templateUrl: './list-vendor-payment.component.html',
  styleUrl: './list-vendor-payment.component.css',
  providers: [CrudListQueryService],
})
export class ListVendorPaymentComponent {
  private readonly router = inject(Router);
  private readonly dateManagement = inject(DateManagementService);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly vendorPaymentStore = inject(VendorPaymentStore);
  protected readonly hasError = computed(() => this.vendorPaymentStore.error() !== null);

  protected readonly columns: readonly TngTableColumn<VendorPayment>[] = [
    { id: 'date', label: 'Date', sortable: true, width: '10rem' },
    { id: 'vendor', label: 'Vendor', width: '14rem' },
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
        void this.vendorPaymentStore.loadVendorPayments({
          ...filter,
          includes: ['vendor', 'bcash'],
        }),
    );
  }

  protected createPayment(): void {
    void this.router.navigate(['/app/trading/vendor-payment/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected editPayment(item: VendorPayment): void {
    if (item.id) {
      void this.router.navigate(['/app/trading/vendor-payment', item.id, 'edit'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected deletePayment(item: VendorPayment): void {
    if (item.id) {
      void this.router.navigate(['/app/trading/vendor-payment', item.id, 'delete'], {
        queryParams: { burl: this.router.url },
      });
    }
  }
}
