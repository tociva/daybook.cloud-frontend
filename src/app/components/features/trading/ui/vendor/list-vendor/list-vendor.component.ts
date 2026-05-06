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
    TngTable,
    TngTableCellTpl,
  ],
  templateUrl: './list-vendor.component.html',
  styleUrl: './list-vendor.component.css',
  providers: [CrudListQueryService],
})
export class ListVendorComponent implements OnInit {
  private readonly router = inject(Router);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly vendorStore = inject(VendorStore);
  protected readonly hasError = computed(() => this.vendorStore.error() !== null);

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

  ngOnInit(): void {
    this.crudQuery.init((filter) => void this.vendorStore.loadVendors(filter));
  }

  protected createVendor(): void {
    void this.router.navigate(['/app/trading/vendor/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected viewVendor(item: Vendor): void {
    if (item.id) {
      void this.router.navigate(['/app/trading/vendor', item.id], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected editVendor(item: Vendor): void {
    if (item.id) {
      void this.router.navigate(['/app/trading/vendor', item.id, 'edit'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected deleteVendor(item: Vendor): void {
    if (item.id) {
      void this.router.navigate(['/app/trading/vendor', item.id, 'delete'], {
        queryParams: { burl: this.router.url },
      });
    }
  }
}
