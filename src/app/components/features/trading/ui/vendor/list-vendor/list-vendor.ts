import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { distinctUntilChanged, map, takeUntil } from 'rxjs/operators';
import { QueryParamsOriginal, QueryParamsRep, parseQueryParams } from '../../../../../../util/query-params-util';
import { DbcColumn } from '../../../../../../util/types/dbc-column.type';
import { EmptyListMessage } from '../../../../../../util/types/empty-list-message.type';
import { ItemLanding } from '../../../../../shared/item-landing/item-landing';
import { Vendor, VendorStore, vendorActions } from '../../../store/vendor';
import { SearchItemStore } from '../../../../../../components/layout/store/search-item/search-item.store';

@Component({
  selector: 'app-list-vendor',
  imports: [ItemLanding],
  templateUrl: './list-vendor.html',
  styleUrl: './list-vendor.css'
})
export class ListVendor implements OnInit, OnDestroy {
 
  private store = inject(Store);
  protected vendorStore = inject(VendorStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private searchItemStore = inject(SearchItemStore);
  // Direct access to signal store properties
  readonly items = this.vendorStore.items;
  readonly count = this.vendorStore.count;
  readonly pageSize = signal<number>(10);
  readonly currentPage = signal<number>(1);

  readonly error = computed(() => {
    const storeError = this.vendorStore.error();
    if (!storeError) return null;
    return storeError;
  });
  readonly handleOnCreateItem = signal<() => void>(() => {
    const currentUrl = this.router.url;
    this.router.navigate(['/trading/vendor/create'], { queryParams: { burl: currentUrl } });
  });

  readonly emptyListMessage = signal<EmptyListMessage>({
    title: 'No vendor entries found',
    description: 'Get started by creating your first vendor entry.',
    buttonText: 'Create First Vendor'
  });

  readonly columns = signal<DbcColumn<Vendor>[]>([
    { header: 'Name', key: 'name', type: 'text', sortable: true },
    { header: 'Mobile', key: 'mobile', type: 'text', sortable: true },
    { header: 'Email', key: 'email', type: 'text', sortable: true },
    { header: 'GSTIN', key: 'gstin', type: 'text', sortable: true },
    { header: 'PAN', key: 'pan', type: 'text', sortable: true },
    { header: 'City', key: 'address.city', type: 'text', sortable: true },
    { header: 'State', key: 'state', type: 'text', sortable: true },
    { header: 'Status', key: 'status', type: 'status' },
    { header: 'Description', key: 'description', type: 'text', sortable: true },
    { header: 'Actions', key: 'actions', type: 'action' }
  ]);

  readonly handleOnEditItem = signal<(item: Vendor) => void>((item: Vendor) => {
    const currentUrl = this.router.url;
    this.router.navigate(['/trading/vendor', item.id, 'edit'], { queryParams: { burl: currentUrl } });
  }); 
  
  readonly handleOnDeleteItem = signal<(item: Vendor) => void>((item: Vendor) => {
    const currentUrl = this.router.url;
    this.router.navigate(['/trading/vendor', item.id, 'delete'], { queryParams: { burl: currentUrl } });
  });

  private destroy$ = new Subject<void>();

  private loadVendors(): void {
    this.route.queryParams.pipe(
      distinctUntilChanged(),
      map((params: QueryParamsOriginal) => parseQueryParams(params)),
      takeUntil(this.destroy$)
    ).subscribe((params: QueryParamsRep) => {
      const { limit, offset, page, sort } = params;
      if(this.pageSize() !== limit) {
        this.pageSize.set(limit ?? 10);
      }
      const search = {query: params.search?.query ?? '', fields: ['description', 'name', 'mobile', 'email', 'gstin', 'pan']};
      this.store.dispatch(vendorActions.loadVendors({ 
        query: { limit: limit ?? 10, offset: offset ?? 0, search: search, sort: sort ?? [] } 
      }));
      if(this.currentPage() !== page) {
        this.currentPage.set(page ?? 1);
      }
    });
    setTimeout(() => {
      this.store.dispatch(vendorActions.countVendors({ query: {} }));
    }, 100);
  }
  
  ngOnInit(): void {
    this.loadVendors();
    this.searchItemStore.setCurrentTitle('Vendor');
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
