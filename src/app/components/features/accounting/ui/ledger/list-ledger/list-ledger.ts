import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { distinctUntilChanged, map, takeUntil } from 'rxjs/operators';
import { QueryParamsOriginal, QueryParamsRep, parseQueryParams } from '../../../../../../util/query-params-util';
import { DbcColumn } from '../../../../../../util/types/dbc-column.type';
import { EmptyListMessage } from '../../../../../../util/types/empty-list-message.type';
import { ItemLanding } from '../../../../../shared/item-landing/item-landing';
import { Ledger, LedgerStore, ledgerActions } from '../../../store/ledger';
import { SearchItemStore } from '../../../../../../components/layout/store/search-item/search-item.store';

@Component({
  selector: 'app-list-ledger',
  imports: [ItemLanding],
  templateUrl: './list-ledger.html',
  styleUrl: './list-ledger.css'
})
export class ListLedger implements OnInit, OnDestroy {
 
  private store = inject(Store);
  protected ledgerStore = inject(LedgerStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private searchItemStore = inject(SearchItemStore);
  // Direct access to signal store properties
  readonly ledgers = this.ledgerStore.items;
  readonly count = this.ledgerStore.count;
  readonly pageSize = signal<number>(10);
  readonly currentPage = signal<number>(1);

  readonly error = computed(() => {
    const storeError = this.ledgerStore.error();
    if (!storeError) return null;
    return storeError;
  });
  readonly handleOnCreateItem = signal<() => void>(() => {
    const currentUrl = this.router.url;
    this.router.navigate(['/accounting/ledger/create'], { queryParams: { burl: currentUrl } });
  });

  readonly emptyListMessage = signal<EmptyListMessage>({
    title: 'No ledger entries found',
    description: 'Get started by creating your first ledger entry.',
    buttonText: 'Create First Ledger'
  });

  readonly columns = signal<DbcColumn<Ledger>[]>([
    { header: 'Name', key: 'name', type: 'text', sortable: true },
    { header: 'Description', key: 'description', type: 'text', sortable: true },
    { header: 'Opening DR', key: 'openingdr', type: 'number', sortable: true },
    { header: 'Opening CR', key: 'openingcr', type: 'number', sortable: true },
    { header: 'Category', key: 'category.name', type: 'text', sortable: true },
    { header: 'Fiscal Year', key: 'fiscalyear.name', type: 'text', sortable: true },
    { header: 'Actions', key: 'actions', type: 'action' }
  ]);

  readonly handleOnEditItem = signal<(ledger: Ledger) => void>((ledger: Ledger) => {
    const currentUrl = this.router.url;
    this.router.navigate(['/accounting/ledger', ledger.id, 'edit'], { queryParams: { burl: currentUrl } });
  }); 
  
  readonly handleOnDeleteItem = signal<(ledger: Ledger) => void>((ledger: Ledger) => {
    const currentUrl = this.router.url;
    this.router.navigate(['/accounting/ledger', ledger.id, 'delete'], { queryParams: { burl: currentUrl } });
  });

  readonly handleOnButton2Click = signal<() => void>(() => {
    this.router.navigate(['/accounting/ledger-category']);
  });

  private destroy$ = new Subject<void>();

  private loadLedgers(): void {
    this.route.queryParams.pipe(
      distinctUntilChanged(),
      map((params: QueryParamsOriginal) => parseQueryParams(params)),
      takeUntil(this.destroy$)
    ).subscribe((params: QueryParamsRep) => {
      const { limit, offset, page, sort } = params;
      if(this.pageSize() !== limit) {
        this.pageSize.set(limit ?? 10);
      }
      const search = {query: params.search?.query ?? '', fields: ['description', 'name']};
      this.store.dispatch(ledgerActions.loadLedgers({ 
        query: { limit: limit ?? 10, offset: offset ?? 0, search: search, sort: sort ?? [], includes: ['category', 'fiscalyear'] } 
      }));
      if(this.currentPage() !== page) {
        this.currentPage.set(page ?? 1);
      }
    });
    setTimeout(() => {
      this.store.dispatch(ledgerActions.countLedgers({ query: {} }));
    }, 100);
  }
  
  ngOnInit(): void {
    this.loadLedgers();
    this.searchItemStore.setCurrentTitle('Ledger');
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchItemStore.setCurrentTitle(null);
  }
}
