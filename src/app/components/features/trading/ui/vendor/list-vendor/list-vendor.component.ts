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
import { VendorStore } from '../../../data/vendor';
import type { Vendor } from '../../../data/vendor';

@Component({
  selector: 'app-list-vendor',
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
    BulkUploadButtonComponent,
  ],
  templateUrl: './list-vendor.component.html',
  styleUrl: './list-vendor.component.css',
  providers: [CrudListQueryService],
})
export class ListVendorComponent {
  private readonly router = inject(Router);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly vendorStore = inject(VendorStore);
  protected readonly hasError = computed(() => this.vendorStore.error() !== null);

  protected readonly bulkUploadConfig: BulkUploadPreviewConfig = {
    modelName: 'Vendors',
    requiredPaths: ['name', 'countrycode', 'currencycode'],
    rootKey: 'vendors',
    sampleRows: [
      {
        name: 'Acme Supplies',
        mobile: '+91 9876543210',
        email: 'sales@acme-supplies.example',
        gstin: '29ABCDE1234F1Z5',
        pan: 'ABCDE1234F',
        address: {
          name: 'Acme Supplies',
          line1: 'Warehouse 2',
          line2: '',
          street: 'Industrial Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          zip: '560002',
          country: 'India',
        },
        countrycode: 'IN',
        state: 'Karnataka',
        currencycode: 'INR',
        description: 'Primary supplier',
      },
    ],
    xlsxColumns: [
      { header: 'Name', path: 'name' },
      { header: 'Mobile', path: 'mobile' },
      { header: 'Email', path: 'email' },
      { header: 'GSTIN', path: 'gstin' },
      { header: 'PAN', path: 'pan' },
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
    xlsxSheetName: 'Vendors',
    columns: [
      bulkUploadTextColumn('name', 'Name', 'name', '14rem'),
      bulkUploadTextColumn('mobile', 'Mobile', 'mobile', '10rem'),
      bulkUploadTextColumn('email', 'Email', 'email', '14rem'),
      bulkUploadTextColumn('gstin', 'GSTIN', 'gstin', '12rem'),
      bulkUploadTextColumn('pan', 'PAN', 'pan', '9rem'),
      bulkUploadTextColumn('city', 'City', 'address.city', '10rem'),
      bulkUploadTextColumn('currencycode', 'Currency', 'currencycode', '8rem'),
    ],
  };

  protected readonly columns: readonly TngTableColumn<Vendor>[] = [
    { id: 'name', label: 'Name', sortable: true, width: '14rem' },
    { id: 'mobile', label: 'Mobile', sortable: true, width: '10rem' },
    { id: 'email', label: 'Email', sortable: true, truncate: true },
    { id: 'gstin', label: 'GSTIN', sortable: true, width: '12rem' },
    { id: 'pan', label: 'PAN', sortable: true, width: '9rem' },
    { id: 'city', label: 'City', width: '10rem' },
    { id: 'state', label: 'State', sortable: true, width: '9rem' },
    { id: 'description', label: 'Description', sortable: true, truncate: true },
    { id: 'actions', label: 'Actions', align: 'end', headerAlign: 'end', width: '8rem' },
  ];

  protected readonly filterFields: readonly CrudFilterField[] = [
    { id: 'name', label: 'Name', placeholder: 'Vendor name', type: 'text' },
    { id: 'mobile', label: 'Mobile', placeholder: 'Mobile number', type: 'text' },
    { id: 'email', label: 'Email', placeholder: 'Email address', type: 'text' },
    { id: 'gstin', label: 'GSTIN', placeholder: 'GSTIN number', type: 'text' },
    { id: 'pan', label: 'PAN', placeholder: 'PAN number', type: 'text' },
    { id: 'state', label: 'State', placeholder: 'State', type: 'text' },
  ];

  constructor() {
    this.crudQuery.init((filter) => void this.vendorStore.loadVendors(filter));
  }

  protected createVendor(): void {
    void this.router.navigate(['/app/trading/vendor/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected reloadVendors(): void {
    void this.vendorStore.loadVendors(this.crudQuery.filter());
  }

  protected viewVendor(item: Vendor): void {
    if (item.id) {
      this.vendorStore.setSelectedItem(item);
      void this.router.navigate(['/app/trading/vendor', item.id], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected editVendor(item: Vendor): void {
    if (item.id) {
      this.vendorStore.setSelectedItem(item);
      void this.router.navigate(['/app/trading/vendor', item.id, 'edit'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected deleteVendor(item: Vendor): void {
    if (item.id) {
      this.vendorStore.setSelectedItem(item);
      void this.router.navigate(['/app/trading/vendor', item.id, 'delete'], {
        queryParams: { burl: this.router.url },
      });
    }
  }
}
