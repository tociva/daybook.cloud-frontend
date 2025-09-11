import { Component, computed, inject, signal } from '@angular/core';
import { ItemLanding } from '../../../../../shared/item-landing/item-landing';
import { SaleInvoiceStore } from '../../../store/sale-invoice/sale-invoice.store';
import { Store } from '@ngrx/store';
import { ActivatedRoute, Router } from '@angular/router';
import { SearchItemStore } from '../../../../../layout/store/search-item/search-item.store';
import { EmptyListMessage } from '../../../../../../util/types/empty-list-message.type';
import { SaleInvoice } from '../../../store/sale-invoice/sale-invoice.model';
import { DbcColumn } from '../../../../../../util/types/dbc-column.type';
import { Subject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { QueryParamsOriginal } from '../../../../../../util/query-params-util';
import { parseQueryParams } from '../../../../../../util/query-params-util';
import { takeUntil } from 'rxjs/operators';
import { QueryParamsRep } from '../../../../../../util/query-params-util';
import { saleInvoiceActions } from '../../../store/sale-invoice/sale-invoice.actions';

@Component({
  selector: 'app-list-sale-invoice',
  imports: [ItemLanding],
  templateUrl: './list-sale-invoice.html',
  styleUrl: './list-sale-invoice.css'
})
export class ListSaleInvoice {
  private store = inject(Store);
  protected saleInvoieStore = inject(SaleInvoiceStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private searchItemStore = inject(SearchItemStore);
  // Direct access to signal store properties
  readonly items = this.saleInvoieStore.items;
  readonly count = this.saleInvoieStore.count;
  readonly pageSize = signal<number>(10);
  readonly currentPage = signal<number>(1);

  readonly error = computed(() => {
    const storeError = this.saleInvoieStore.error();
    if (!storeError) return null;
    return storeError;
  });
  readonly handleOnCreateItem = signal<() => void>(() => {
    const currentUrl = this.router.url;
    this.router.navigate(['/trading/sale-invoice/create'], { queryParams: { burl: currentUrl } });
  });

  readonly emptyListMessage = signal<EmptyListMessage>({
    title: 'No sale invoice entries found',
    description: 'Get started by creating your first sale invoice entry.',
    buttonText: 'Create First Sale Invoice'
  });

  readonly columns = signal<DbcColumn<SaleInvoice>[]>([
    { header: 'Name', key: 'name', type: 'text', sortable: true },
    { header: 'Code', key: 'code', type: 'text', sortable: true },
    { header: 'Customer', key: 'customer.name', type: 'text', sortable: false },
    { header: 'Description', key: 'description', type: 'text', sortable: true },
    { header: 'Actions', key: 'actions', type: 'action' }
  ]);

  readonly handleOnEditItem = signal<(item: SaleInvoice) => void>((item: SaleInvoice) => {
    const currentUrl = this.router.url;
    this.router.navigate(['/trading/sale-invoice', item.id, 'edit'], { queryParams: { burl: currentUrl } });
  }); 
  
  readonly handleOnDeleteItem = signal<(item: SaleInvoice) => void>((item: SaleInvoice) => {
    const currentUrl = this.router.url;
    this.router.navigate(['/trading/sale-invoice', item.id, 'delete'], { queryParams: { burl: currentUrl } });
  });

  private destroy$ = new Subject<void>();

  private loadSaleInvoices(): void {
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
      this.store.dispatch(saleInvoiceActions.loadSaleInvoices({ 
        query: { limit: limit ?? 10, offset: offset ?? 0, search: search, sort: sort ?? [], includes: ['customer'] } 
      }));
      if(this.currentPage() !== page) {
        this.currentPage.set(page ?? 1);
      }
    });
    setTimeout(() => {
      this.store.dispatch(saleInvoiceActions.countSaleInvoices({ query: {} }));
    }, 100);
  }
  
  ngOnInit(): void {
    this.loadSaleInvoices();
    this.searchItemStore.setCurrentTitle('Sale Invoice');
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchItemStore.setCurrentTitle(null);
  }
}
