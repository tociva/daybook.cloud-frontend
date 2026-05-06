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
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { CustomerStore } from '../../../data/customer';
import type { Customer } from '../../../data/customer';

@Component({
  selector: 'app-list-customer',
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
  templateUrl: './list-customer.component.html',
  styleUrl: './list-customer.component.css',
  providers: [CrudListQueryService],
})
export class ListCustomerComponent implements OnInit {
  private readonly router = inject(Router);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly customerStore = inject(CustomerStore);
  protected readonly hasError = computed(() => this.customerStore.error() !== null);

  protected readonly columns: readonly TngTableColumn<Customer>[] = [
    { id: 'name', label: 'Name', sortable: true, width: '14rem' },
    { id: 'mobile', label: 'Mobile', sortable: true, width: '10rem' },
    { id: 'email', label: 'Email', sortable: true, truncate: true },
    { id: 'gstin', label: 'GSTIN', sortable: true, width: '12rem' },
    { id: 'city', label: 'City', width: '10rem' },
    { id: 'state', label: 'State', sortable: true, width: '9rem' },
    { id: 'description', label: 'Description', sortable: true, truncate: true },
    { id: 'actions', label: 'Actions', align: 'end', headerAlign: 'end', width: '8rem' },
  ];

  protected readonly filterFields: readonly CrudFilterField[] = [
    { id: 'name', label: 'Name', placeholder: 'Customer name', type: 'text' },
    { id: 'mobile', label: 'Mobile', placeholder: 'Mobile number', type: 'text' },
    { id: 'email', label: 'Email', placeholder: 'Email address', type: 'text' },
    { id: 'gstin', label: 'GSTIN', placeholder: 'GSTIN number', type: 'text' },
    { id: 'state', label: 'State', placeholder: 'State', type: 'text' },
  ];

  ngOnInit(): void {
    this.crudQuery.init((filter) => void this.customerStore.loadCustomers(filter));
  }

  protected createCustomer(): void {
    void this.router.navigate(['/app/trading/customer/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected viewCustomer(item: Customer): void {
    if (item.id) {
      void this.router.navigate(['/app/trading/customer', item.id], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected editCustomer(item: Customer): void {
    if (item.id) {
      void this.router.navigate(['/app/trading/customer', item.id, 'edit'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected deleteCustomer(item: Customer): void {
    if (item.id) {
      void this.router.navigate(['/app/trading/customer', item.id, 'delete'], {
        queryParams: { burl: this.router.url },
      });
    }
  }
}
