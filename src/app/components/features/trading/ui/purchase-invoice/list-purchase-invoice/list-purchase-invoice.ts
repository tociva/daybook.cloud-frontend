import { Component, computed, inject, signal } from '@angular/core';
import { ItemLanding } from '../../../../../shared/item-landing/item-landing';
import { PurchaseInvoiceStore } from '../../../store/purchase-invoice/purchase-invoice.store';
import { Store } from '@ngrx/store';
import { ActivatedRoute, Router } from '@angular/router';
import { SearchItemStore } from '../../../../../layout/store/search-item/search-item.store';
import { EmptyListMessage } from '../../../../../../util/types/empty-list-message.type';
import { PurchaseInvoice } from '../../../store/purchase-invoice/purchase-invoice.model';
import { DbcColumn } from '../../../../../../util/types/dbc-column.type';
import { Subject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { QueryParamsOriginal } from '../../../../../../util/query-params-util';
import { parseQueryParams } from '../../../../../../util/query-params-util';
import { takeUntil } from 'rxjs/operators';
import { QueryParamsRep } from '../../../../../../util/query-params-util';
import { purchaseInvoiceActions } from '../../../store/purchase-invoice/purchase-invoice.actions';

@Component({
  selector: 'app-list-purchase-invoice',
  imports: [ItemLanding],
  templateUrl: './list-purchase-invoice.html',
  styleUrl: './list-purchase-invoice.css'
})
export class ListPurchaseInvoice {
  private store = inject(Store);
  protected purchaseInvoiceStore = inject(PurchaseInvoiceStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private searchItemStore = inject(SearchItemStore);
  
  readonly items = this.purchaseInvoiceStore.items;
  readonly count = this.purchaseInvoiceStore.count;
  readonly pageSize = signal<number>(10);
  readonly currentPage = signal<number>(1);

  readonly error = computed(() => {
    const storeError = this.purchaseInvoiceStore.error();
    if (!storeError) return null;
    return storeError;
  });

  readonly handleOnCreateItem = signal<() => void>(() => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/trading/purchase-invoice/create'], { queryParams: { burl: currentUrl } });
  });

  readonly emptyListMessage = signal<EmptyListMessage>({
    title: 'No purchase invoice entries found',
    description: 'Get started by creating your first purchase invoice entry.',
    buttonText: 'Create First Purchase Invoice'
  });

  readonly columns = signal<DbcColumn<PurchaseInvoice>[]>([
    { header: 'Number', key: 'number', type: 'text', sortable: true },
    { header: 'Vendor', key: 'vendor.name', type: 'text', sortable: false },
    { header: 'Date', key: 'date', type: 'date', sortable: true },
    { header: 'Sub Total', key: 'subtotal', type: 'number', sortable: true },
    { header: 'Tax', key: 'tax', type: 'number', sortable: true },
    { header: 'Discount', key: 'discount', type: 'number', sortable: true },
    { header: 'Grand Total', key: 'grandtotal', type: 'number', sortable: true },
    { header: 'Actions', key: 'actions', type: 'action' }
  ]);

  readonly handleOnEditItem = signal<(item: PurchaseInvoice) => void>((item: PurchaseInvoice) => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/trading/purchase-invoice', item.id, 'edit'], { queryParams: { burl: currentUrl } });
  }); 
  
  readonly handleOnDeleteItem = signal<(item: PurchaseInvoice) => void>((item: PurchaseInvoice) => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/trading/purchase-invoice', item.id, 'delete'], { queryParams: { burl: currentUrl } });
  });

  private destroy$ = new Subject<void>();

  private loadPurchaseInvoices(): void {
    this.route.queryParams.pipe(
      distinctUntilChanged(),
      map((params: QueryParamsOriginal) => parseQueryParams(params)),
      takeUntil(this.destroy$)
    ).subscribe((params: QueryParamsRep) => {
      const { limit, offset, page, sort } = params;
      if(this.pageSize() !== limit) {
        this.pageSize.set(limit ?? 10);
      }
      const search = {query: params.search?.query ?? '', fields: ['description', 'name', 'code'],};
      this.store.dispatch(purchaseInvoiceActions.loadPurchaseInvoices({ 
        query: { limit: limit ?? 10, offset: offset ?? 0, search: search, sort: sort ?? [], includes: ['vendor'] } 
      }));
      if(this.currentPage() !== page) {
        this.currentPage.set(page ?? 1);
      }
    });
    setTimeout(() => {
      this.store.dispatch(purchaseInvoiceActions.countPurchaseInvoices({ query: {} }));
    }, 100);
  }
  
  ngOnInit(): void {
    this.loadPurchaseInvoices();
    this.searchItemStore.setCurrentTitle('Purchase Invoice');
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchItemStore.setCurrentTitle(null);
  }
}

