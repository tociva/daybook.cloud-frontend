import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { distinctUntilChanged, map, takeUntil } from 'rxjs/operators';
import { QueryParamsOriginal, QueryParamsRep, parseQueryParams } from '../../../../../../util/query-params-util';
import { DbcColumn } from '../../../../../../util/types/dbc-column.type';
import { EmptyListMessage } from '../../../../../../util/types/empty-list-message.type';
import { ItemLanding } from '../../../../../shared/item-landing/item-landing';
import { LedgerCategory, LedgerCategoryStore, ledgerCategoryActions } from '../../../store/ledger-category';
import { SearchItemStore } from '../../../../../../components/layout/store/search-item/search-item.store';

@Component({
  selector: 'app-list-ledger-category',
  imports: [ItemLanding],
  templateUrl: './list-ledger-category.html',
  styleUrl: './list-ledger-category.css'
})
export class ListLedgerCategory implements OnInit, OnDestroy {
 
  private store = inject(Store);
  protected ledgerCategoryStore = inject(LedgerCategoryStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private searchItemStore = inject(SearchItemStore);
  // Direct access to signal store properties
  readonly items = this.ledgerCategoryStore.items;
  readonly count = this.ledgerCategoryStore.count;
  readonly pageSize = signal<number>(10);
  readonly currentPage = signal<number>(1);

  readonly error = computed(() => {
    const storeError = this.ledgerCategoryStore.error();
    if (!storeError) return null;
    return storeError;
  });
  readonly handleOnCreateItem = signal<() => void>(() => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/accounting/ledger-category/create'], { queryParams: { burl: currentUrl } });
  });

  readonly emptyListMessage = signal<EmptyListMessage>({
    title: 'No ledger category entries found',
    description: 'Get started by creating your first ledger category entry.',
    buttonText: 'Create First Ledger Category'
  });

  readonly columns = signal<DbcColumn<LedgerCategory>[]>([
    { header: 'Name', key: 'name', type: 'text', sortable: true },
    { header: 'Description', key: 'description', type: 'text', sortable: true },
    { header: 'Parent Category', key: 'parent.name', type: 'text', sortable: false },
    { header: 'Category Type', key: 'props.type', type: 'text', sortable: true },
    { header: 'Fiscal Year', key: 'fiscalyear.name', type: 'text', sortable: true },
    { header: 'Actions', key: 'actions', type: 'action' }
  ]);

  readonly handleOnEditItem = signal<(item: LedgerCategory) => void>((item: LedgerCategory) => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/accounting/ledger-category', item.id, 'edit'], { queryParams: { burl: currentUrl } });
  }); 
  
  readonly handleOnDeleteItem = signal<(item: LedgerCategory) => void>((item: LedgerCategory) => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/accounting/ledger-category', item.id, 'delete'], { queryParams: { burl: currentUrl } });
  });

  readonly handleOnButton2Click = signal<() => void>(() => {
    this.router.navigate(['/app/accounting/ledger']);
  });

  private destroy$ = new Subject<void>();

  private loadLedgerCategories(): void {
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
      this.store.dispatch(ledgerCategoryActions.loadLedgerCategories({ 
        query: { limit: limit ?? 10, offset: offset ?? 0, search: search, sort: sort ?? [], includes: ['parent', 'fiscalyear'] } 
      }));
      if(this.currentPage() !== page) {
        this.currentPage.set(page ?? 1);
      }
    });
    setTimeout(() => {
      this.store.dispatch(ledgerCategoryActions.countLedgerCategories({ query: {} }));
    }, 100);
  }
  
  ngOnInit(): void {
    this.loadLedgerCategories();
    this.searchItemStore.setCurrentTitle('Ledger Category');
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchItemStore.setCurrentTitle(null);
  }
}
