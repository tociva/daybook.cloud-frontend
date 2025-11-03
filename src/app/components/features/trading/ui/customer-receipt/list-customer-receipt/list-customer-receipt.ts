import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { distinctUntilChanged, map, takeUntil } from 'rxjs/operators';
import { QueryParamsOriginal, QueryParamsRep, parseQueryParams } from '../../../../../../util/query-params-util';
import { DbcColumn } from '../../../../../../util/types/dbc-column.type';
import { EmptyListMessage } from '../../../../../../util/types/empty-list-message.type';
import { ItemLanding } from '../../../../../shared/item-landing/item-landing';
import { CustomerReceipt, CustomerReceiptStore, customerReceiptActions } from '../../../store/customer-receipt';
import { SearchItemStore } from '../../../../../../components/layout/store/search-item/search-item.store';

@Component({
  selector: 'app-list-customer-receipt',
  imports: [ItemLanding],
  templateUrl: './list-customer-receipt.html',
  styleUrl: './list-customer-receipt.css'
})
export class ListCustomerReceipt implements OnInit, OnDestroy {
 
  private store = inject(Store);
  protected customerReceiptStore = inject(CustomerReceiptStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private searchItemStore = inject(SearchItemStore);
  // Direct access to signal store properties
  readonly items = this.customerReceiptStore.items;
  readonly count = this.customerReceiptStore.count;
  readonly pageSize = signal<number>(10);
  readonly currentPage = signal<number>(1);

  readonly error = computed(() => {
    const storeError = this.customerReceiptStore.error();
    if (!storeError) return null;
    return storeError;
  });
  readonly handleOnCreateItem = signal<() => void>(() => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/trading/customer-receipt/create'], { queryParams: { burl: currentUrl } });
  });

  readonly emptyListMessage = signal<EmptyListMessage>({
    title: 'No customer receipt entries found',
    description: 'Get started by creating your first customer receipt entry.',
    buttonText: 'Create First Customer Receipt'
  });

  readonly columns = signal<DbcColumn<CustomerReceipt>[]>([
    { header: 'Date', key: 'date', type: 'date', sortable: true },
    { header: 'Customer', key: 'customer.name', type: 'text', sortable: false },
    { header: 'Amount', key: 'amount', type: 'number', sortable: true },
    { header: 'Currency', key: 'currency.code', type: 'text', sortable: false },
    { header: 'Bank/Cash', key: 'bcash.name', type: 'text', sortable: false },
    { header: 'Description', key: 'description', type: 'text', sortable: true },
    { header: 'Actions', key: 'actions', type: 'action' }
  ]);

  readonly handleOnEditItem = signal<(item: CustomerReceipt) => void>((item: CustomerReceipt) => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/trading/customer-receipt', item.id, 'edit'], { queryParams: { burl: currentUrl } });
  }); 
  
  readonly handleOnDeleteItem = signal<(item: CustomerReceipt) => void>((item: CustomerReceipt) => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/trading/customer-receipt', item.id, 'delete'], { queryParams: { burl: currentUrl } });
  });

  private destroy$ = new Subject<void>();

  private loadCustomerReceipts(): void {
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
      this.store.dispatch(customerReceiptActions.loadCustomerReceipts({ 
        query: { limit: limit ?? 10, offset: offset ?? 0, search: search, sort: sort ?? [], includes: ['customer', 'currency', 'bcash'] } 
      }));
      if(this.currentPage() !== page) {
        this.currentPage.set(page ?? 1);
      }
    });
    setTimeout(() => {
      this.store.dispatch(customerReceiptActions.countCustomerReceipts({ query: {} }));
    }, 100);
  }
  
  ngOnInit(): void {
    this.loadCustomerReceipts();
    this.searchItemStore.setCurrentTitle('Customer Receipt');
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchItemStore.setCurrentTitle(null);
  }
}

