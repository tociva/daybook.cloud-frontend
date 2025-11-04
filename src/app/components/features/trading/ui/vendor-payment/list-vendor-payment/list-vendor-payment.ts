import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { distinctUntilChanged, map, takeUntil } from 'rxjs/operators';
import { QueryParamsOriginal, QueryParamsRep, parseQueryParams } from '../../../../../../util/query-params-util';
import { DbcColumn } from '../../../../../../util/types/dbc-column.type';
import { EmptyListMessage } from '../../../../../../util/types/empty-list-message.type';
import { ItemLanding } from '../../../../../shared/item-landing/item-landing';
import { VendorPayment, VendorPaymentStore, vendorPaymentActions } from '../../../store/vendor-payment';
import { SearchItemStore } from '../../../../../../components/layout/store/search-item/search-item.store';

@Component({
  selector: 'app-list-vendor-payment',
  imports: [ItemLanding],
  templateUrl: './list-vendor-payment.html',
  styleUrl: './list-vendor-payment.css'
})
export class ListVendorPayment implements OnInit, OnDestroy {
 
  private store = inject(Store);
  protected vendorPaymentStore = inject(VendorPaymentStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private searchItemStore = inject(SearchItemStore);
  // Direct access to signal store properties
  readonly items = this.vendorPaymentStore.items;
  readonly count = this.vendorPaymentStore.count;
  readonly pageSize = signal<number>(10);
  readonly currentPage = signal<number>(1);

  readonly error = computed(() => {
    const storeError = this.vendorPaymentStore.error();
    if (!storeError) return null;
    return storeError;
  });
  readonly handleOnCreateItem = signal<() => void>(() => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/trading/vendor-payment/create'], { queryParams: { burl: currentUrl } });
  });

  readonly emptyListMessage = signal<EmptyListMessage>({
    title: 'No vendor payment entries found',
    description: 'Get started by creating your first vendor payment entry.',
    buttonText: 'Create First Vendor Payment'
  });

  readonly columns = signal<DbcColumn<VendorPayment>[]>([
    { header: 'Date', key: 'date', type: 'date', sortable: true },
    { header: 'Vendor', key: 'vendor.name', type: 'text', sortable: false },
    { header: 'Amount', key: 'amount', type: 'number', sortable: true },
    { header: 'Currency', key: 'currency.code', type: 'text', sortable: false },
    { header: 'Bank/Cash', key: 'bcash.name', type: 'text', sortable: false },
    { header: 'Description', key: 'description', type: 'text', sortable: true },
    { header: 'Actions', key: 'actions', type: 'action' }
  ]);

  readonly handleOnEditItem = signal<(item: VendorPayment) => void>((item: VendorPayment) => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/trading/vendor-payment', item.id, 'edit'], { queryParams: { burl: currentUrl } });
  }); 
  
  readonly handleOnDeleteItem = signal<(item: VendorPayment) => void>((item: VendorPayment) => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/trading/vendor-payment', item.id, 'delete'], { queryParams: { burl: currentUrl } });
  });

  private destroy$ = new Subject<void>();

  private loadVendorPayments(): void {
    this.route.queryParams.pipe(
      distinctUntilChanged(),
      map((params: QueryParamsOriginal) => parseQueryParams(params)),
      takeUntil(this.destroy$)
    ).subscribe((params: QueryParamsRep) => {
      const { limit, offset, page, sort } = params;
      if(this.pageSize() !== limit) {
        this.pageSize.set(limit ?? 10);
      }
      const search = params.search?.length ? params.search : [{query: '', fields: ['description']}];
      this.store.dispatch(vendorPaymentActions.loadVendorPayments({ 
        query: { limit: limit ?? 10, offset: offset ?? 0, search: search, sort: sort ?? [], includes: ['vendor', 'currency', 'bcash'] } 
      }));
      if(this.currentPage() !== page) {
        this.currentPage.set(page ?? 1);
      }
    });
    setTimeout(() => {
      this.store.dispatch(vendorPaymentActions.countVendorPayments({ query: {} }));
    }, 100);
  }
  
  ngOnInit(): void {
    this.loadVendorPayments();
    this.searchItemStore.setCurrentTitle('Vendor Payment');
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchItemStore.setCurrentTitle(null);
  }
}

