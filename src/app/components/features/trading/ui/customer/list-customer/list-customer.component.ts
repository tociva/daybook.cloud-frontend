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
  BulkUploadButtonComponent,
  bulkUploadTextColumn,
} from '../../../../../../shared/bulk-upload';
import type { BulkUploadPreviewConfig } from '../../../../../../shared/bulk-upload';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { EmptyStateComponent } from '../../../../../../shared/empty-state';
import { TableRowIconButtonComponent } from '../../../../../../shared/table-row-icon-button';
import { CustomerStore } from '../../../data/customer';
import type { Customer } from '../../../data/customer';

import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
@Component({
  selector: 'app-list-customer',
  standalone: true,
  imports: [
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
    BulkUploadButtonComponent,
  ],
  templateUrl: './list-customer.component.html',
  styleUrl: './list-customer.component.css',
  providers: [CrudListQueryService],
})
export class ListCustomerComponent {
  private readonly router = inject(Router);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly customerStore = inject(CustomerStore);
  protected readonly hasError = computed(() => this.customerStore.error() !== null);

  protected readonly bulkUploadConfig: BulkUploadPreviewConfig = {
    modelName: 'Customers',
    requiredPaths: ['name', 'countrycode', 'currencycode'],
    rootKey: 'customers',
    sampleRows: [
      {
        name: 'Acme Retail',
        mobile: '+91 9876543210',
        email: 'billing@acme.example',
        gstin: '29ABCDE1234F1Z5',
        address: {
          name: 'Acme Retail',
          line1: 'Plot 10',
          line2: '',
          street: 'MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          zip: '560001',
          country: 'India',
        },
        countrycode: 'IN',
        state: 'Karnataka',
        currencycode: 'INR',
        description: 'Retail customer',
      },
    ],
    xlsxColumns: [
      { header: 'Name', path: 'name' },
      { header: 'Mobile', path: 'mobile' },
      { header: 'Email', path: 'email' },
      { header: 'GSTIN', path: 'gstin' },
      { header: 'Address Name', path: 'address.name' },
      { header: 'Address Line 1', path: 'address.line1' },
      { header: 'Address Line 2', path: 'address.line2' },
      { header: 'Street', path: 'address.street' },
      { header: 'City', path: 'address.city' },
      { header: 'Address State', path: 'address.state' },
      { header: 'Zip', path: 'address.zip' },
      { header: 'Country', path: 'address.country' },
      { header: 'Country Code', path: 'countrycode' },
      { header: 'State', path: 'state' },
      { header: 'Currency Code', path: 'currencycode' },
      { header: 'Description', path: 'description' },
    ],
    xlsxSheetName: 'Customers',
    columns: [
      bulkUploadTextColumn('name', 'Name', 'name', '14rem'),
      bulkUploadTextColumn('mobile', 'Mobile', 'mobile', '10rem'),
      bulkUploadTextColumn('email', 'Email', 'email', '14rem'),
      bulkUploadTextColumn('gstin', 'GSTIN', 'gstin', '12rem'),
      bulkUploadTextColumn('city', 'City', 'address.city', '10rem'),
      bulkUploadTextColumn('state', 'State', 'state', '10rem'),
      bulkUploadTextColumn('currencycode', 'Currency', 'currencycode', '8rem'),
    ],
  };

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

  constructor() {
    this.crudQuery.init((filter) => void this.customerStore.loadCustomers(filter));
  }

  protected createCustomer(): void {
    void this.router.navigate(['/app/trading/customer/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected reloadCustomers(): void {
    void this.customerStore.loadCustomers(this.crudQuery.filter());
  }

  protected viewCustomer(item: Customer): void {
    if (item.id) {
      this.customerStore.setSelectedItem(item);
      void this.router.navigate(['/app/trading/customer', item.id], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected editCustomer(item: Customer): void {
    if (item.id) {
      this.customerStore.setSelectedItem(item);
      void this.router.navigate(['/app/trading/customer', item.id, 'edit'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected deleteCustomer(item: Customer): void {
    if (item.id) {
      this.customerStore.setSelectedItem(item);
      void this.router.navigate(['/app/trading/customer', item.id, 'delete'], {
        queryParams: { burl: this.router.url },
      });
    }
  }
}
