import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { distinctUntilChanged, map, takeUntil } from 'rxjs/operators';
import { QueryParamsOriginal, QueryParamsRep, parseQueryParams } from '../../../../../../util/query-params-util';
import { DbcColumn } from '../../../../../../util/types/dbc-column.type';
import { EmptyListMessage } from '../../../../../../util/types/empty-list-message.type';
import { ItemLanding } from '../../../../../shared/item-landing/item-landing';
import { ItemCategory, ItemCategoryStore, itemCategoryActions } from '../../../store/item-category';
import { SearchItemStore } from '../../../../../../components/layout/store/search-item/search-item.store';

@Component({
  selector: 'app-list-item-category',
  imports: [ItemLanding],
  templateUrl: './list-item-category.html',
  styleUrl: './list-item-category.css'
})
export class ListItemCategory implements OnInit, OnDestroy {
 
  private store = inject(Store);
  protected itemCategoryStore = inject(ItemCategoryStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private searchItemStore = inject(SearchItemStore);
  // Direct access to signal store properties
  readonly items = this.itemCategoryStore.items;
  readonly count = this.itemCategoryStore.count;
  readonly pageSize = signal<number>(10);
  readonly currentPage = signal<number>(1);

  readonly error = computed(() => {
    const storeError = this.itemCategoryStore.error();
    if (!storeError) return null;
    return storeError;
  });
  readonly handleOnCreateItem = signal<() => void>(() => {
    const currentUrl = this.router.url;
    this.router.navigate(['/trading/item-category/create'], { queryParams: { burl: currentUrl } });
  });

  readonly emptyListMessage = signal<EmptyListMessage>({
    title: 'No item category entries found',
    description: 'Get started by creating your first item category entry.',
    buttonText: 'Create First Item Category'
  });

  readonly columns = signal<DbcColumn<ItemCategory>[]>([
    { header: 'Name', key: 'name', type: 'text', sortable: true },
    { header: 'Code', key: 'code', type: 'text', sortable: true },
    { header: 'Parent Category', key: 'parent.name', type: 'text', sortable: false },
    { header: 'Description', key: 'description', type: 'text', sortable: true },
    { header: 'Actions', key: 'actions', type: 'action' }
  ]);

  readonly handleOnEditItem = signal<(item: ItemCategory) => void>((item: ItemCategory) => {
    const currentUrl = this.router.url;
    this.router.navigate(['/trading/item-category', item.id, 'edit'], { queryParams: { burl: currentUrl } });
  }); 
  
  readonly handleOnDeleteItem = signal<(item: ItemCategory) => void>((item: ItemCategory) => {
    const currentUrl = this.router.url;
    this.router.navigate(['/trading/item-category', item.id, 'delete'], { queryParams: { burl: currentUrl } });
  });

  readonly handleOnButton2Click = signal<() => void>(() => {
    this.router.navigate(['/trading/item']);
  });

  private destroy$ = new Subject<void>();

  private loadItemCategories(): void {
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
      this.store.dispatch(itemCategoryActions.loadItemCategories({ 
        query: { limit: limit ?? 10, offset: offset ?? 0, search: search, sort: sort ?? [], includes: ['parent'] } 
      }));
      if(this.currentPage() !== page) {
        this.currentPage.set(page ?? 1);
      }
    });
    setTimeout(() => {
      this.store.dispatch(itemCategoryActions.countItemCategories({ query: {} }));
    }, 100);
  }
  
  ngOnInit(): void {
    this.loadItemCategories();
    this.searchItemStore.setCurrentTitle('Item Category');
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchItemStore.setCurrentTitle(null);
  }
}
