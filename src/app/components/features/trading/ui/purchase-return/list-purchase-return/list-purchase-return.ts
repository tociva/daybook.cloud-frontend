import { Component, computed, inject, signal } from '@angular/core';
import { ItemLanding } from '../../../../../shared/item-landing/item-landing';
import { PurchaseReturnStore } from '../../../store/purchase-return/purchase-return.store';
import { Store } from '@ngrx/store';
import { ActivatedRoute, Router } from '@angular/router';
import { SearchItemStore } from '../../../../../layout/store/search-item/search-item.store';
import { EmptyListMessage } from '../../../../../../util/types/empty-list-message.type';
import { PurchaseReturn } from '../../../store/purchase-return/purchase-return.model';
import { DbcColumn } from '../../../../../../util/types/dbc-column.type';
import { Subject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { QueryParamsOriginal } from '../../../../../../util/query-params-util';
import { parseQueryParams } from '../../../../../../util/query-params-util';
import { takeUntil } from 'rxjs/operators';
import { QueryParamsRep } from '../../../../../../util/query-params-util';
import { purchaseReturnActions } from '../../../store/purchase-return/purchase-return.actions';

@Component({
  selector: 'app-list-purchase-return',
  imports: [ItemLanding],
  templateUrl: './list-purchase-return.html',
  styleUrl: './list-purchase-return.css'
})
export class ListPurchaseReturn {
  private store = inject(Store);
  protected purchaseReturnStore = inject(PurchaseReturnStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private searchItemStore = inject(SearchItemStore);
  
  readonly items = this.purchaseReturnStore.items;
  readonly count = this.purchaseReturnStore.count;
  readonly pageSize = signal<number>(10);
  readonly currentPage = signal<number>(1);

  readonly error = computed(() => {
    const storeError = this.purchaseReturnStore.error();
    if (!storeError) return null;
    return storeError;
  });

  readonly handleOnCreateItem = signal<() => void>(() => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/trading/purchase-return/create'], { queryParams: { burl: currentUrl } });
  });

  readonly emptyListMessage = signal<EmptyListMessage>({
    title: 'No purchase return entries found',
    description: 'Get started by creating your first purchase return entry.',
    buttonText: 'Create First Purchase Return'
  });

  readonly columns = signal<DbcColumn<PurchaseReturn>[]>([
    { header: 'Number', key: 'number', type: 'text', sortable: true },
    { header: 'Purchase Invoice', key: 'purchaseinvoice.number', type: 'text', sortable: false },
    { header: 'Date', key: 'date', type: 'date', sortable: true },
    { header: 'Item Total', key: 'itemtotal', type: 'number', sortable: true },
    { header: 'Tax', key: 'tax', type: 'number', sortable: true },
    { header: 'Grand Total', key: 'grandtotal', type: 'number', sortable: true },
    { header: 'Actions', key: 'actions', type: 'action' }
  ]);

  readonly handleOnEditItem = signal<(item: PurchaseReturn) => void>((item: PurchaseReturn) => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/trading/purchase-return', item.id, 'edit'], { queryParams: { burl: currentUrl } });
  }); 
  
  readonly handleOnDeleteItem = signal<(item: PurchaseReturn) => void>((item: PurchaseReturn) => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/trading/purchase-return', item.id, 'delete'], { queryParams: { burl: currentUrl } });
  });

  private destroy$ = new Subject<void>();

  private loadPurchaseReturns(): void {
    this.route.queryParams.pipe(
      distinctUntilChanged(),
      map((params: QueryParamsOriginal) => parseQueryParams(params)),
      takeUntil(this.destroy$)
    ).subscribe((params: QueryParamsRep) => {
      const { limit, offset, page, sort } = params;
      if(this.pageSize() !== limit) {
        this.pageSize.set(limit ?? 10);
      }
      const search = params.search?.length ? params.search : [{query: '', fields: ['description', 'name', 'code']}];
      this.store.dispatch(purchaseReturnActions.loadPurchaseReturns({ 
        query: { limit: limit ?? 10, offset: offset ?? 0, search: search, sort: sort ?? [], includes: ['purchaseinvoice'] } 
      }));
      if(this.currentPage() !== page) {
        this.currentPage.set(page ?? 1);
      }
    });
    setTimeout(() => {
      this.store.dispatch(purchaseReturnActions.countPurchaseReturns({ query: {} }));
    }, 100);
  }
  
  ngOnInit(): void {
    this.loadPurchaseReturns();
    this.searchItemStore.setCurrentTitle('Purchase Return');
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchItemStore.setCurrentTitle(null);
  }
}

