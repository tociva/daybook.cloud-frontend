import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { distinctUntilChanged, map, takeUntil } from 'rxjs/operators';
import { QueryParamsOriginal, QueryParamsRep, parseQueryParams } from '../../../../../../util/query-params-util';
import { DbcColumn } from '../../../../../../util/types/dbc-column.type';
import { EmptyListMessage } from '../../../../../../util/types/empty-list-message.type';
import { ItemLanding } from '../../../../../shared/item-landing/item-landing';
import { Item, ItemStore, itemActions } from '../../../store/item';
import { SearchItemStore } from '../../../../../../components/layout/store/search-item/search-item.store';

@Component({
  selector: 'app-list-item',
  imports: [ItemLanding],
  templateUrl: './list-item.html',
  styleUrl: './list-item.css'
})
export class ListItem implements OnInit, OnDestroy {
 
  private store = inject(Store);
  protected itemStore = inject(ItemStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private searchItemStore = inject(SearchItemStore);
  // Direct access to signal store properties
  readonly items = this.itemStore.items;
  readonly count = this.itemStore.count;
  readonly pageSize = signal<number>(10);
  readonly currentPage = signal<number>(1);

  readonly error = computed(() => {
    const storeError = this.itemStore.error();
    if (!storeError) return null;
    return storeError;
  });
  readonly handleOnCreateItem = signal<() => void>(() => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/trading/item/create'], { queryParams: { burl: currentUrl } });
  });

  readonly emptyListMessage = signal<EmptyListMessage>({
    title: 'No item entries found',
    description: 'Get started by creating your first item entry.',
    buttonText: 'Create First Item'
  });

  readonly columns = signal<DbcColumn<Item>[]>([
    { header: 'Name', key: 'name', type: 'text', sortable: true },
    { header: 'Code', key: 'code', type: 'text', sortable: true },
    { header: 'Display Name', key: 'displayname', type: 'text', sortable: true },
    { header: 'Type', key: 'type', type: 'text', sortable: true },
    { header: 'Barcode', key: 'barcode', type: 'text', sortable: true },
    { header: 'Category', key: 'category.name', type: 'text', sortable: true },
    { header: 'Status', key: 'status', type: 'status' },
    { header: 'Description', key: 'description', type: 'text', sortable: true },
    { header: 'Actions', key: 'actions', type: 'action' }
  ]);

  readonly handleOnEditItem = signal<(item: Item) => void>((item: Item) => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/trading/item', item.id, 'edit'], { queryParams: { burl: currentUrl } });
  }); 
  
  readonly handleOnDeleteItem = signal<(item: Item) => void>((item: Item) => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/trading/item', item.id, 'delete'], { queryParams: { burl: currentUrl } });
  });

  readonly handleOnButton2Click = signal<() => void>(() => {
    this.router.navigate(['/app/trading/item-category']);
  });

  private destroy$ = new Subject<void>();

  private loadItems(): void {
    this.route.queryParams.pipe(
      distinctUntilChanged(),
      map((params: QueryParamsOriginal) => parseQueryParams(params)),
      takeUntil(this.destroy$)
    ).subscribe((params: QueryParamsRep) => {
      const { limit, offset, page, sort } = params;
      if(this.pageSize() !== limit) {
        this.pageSize.set(limit ?? 10);
      }
      const search = {query: params.search?.query ?? '', fields: ['description', 'name', 'code', 'displayname', 'barcode']};
      this.store.dispatch(itemActions.loadItems({ 
        query: { limit: limit ?? 10, offset: offset ?? 0, search: search, sort: sort ?? [], includes: ['category'] } 
      }));
      if(this.currentPage() !== page) {
        this.currentPage.set(page ?? 1);
      }
    });
    setTimeout(() => {
      this.store.dispatch(itemActions.countItems({ query: {} }));
    }, 100);
  }
  
  ngOnInit(): void {
    this.loadItems();
    this.searchItemStore.setCurrentTitle('Item');
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchItemStore.setCurrentTitle(null);
  }
}
