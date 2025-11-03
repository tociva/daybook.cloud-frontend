import { Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { distinctUntilChanged, map, takeUntil, tap } from 'rxjs/operators';
import { QueryParamsOriginal, QueryParamsRep, parseQueryParams } from '../../../../../../util/query-params-util';
import { DbcColumn } from '../../../../../../util/types/dbc-column.type';
import { EmptyListMessage } from '../../../../../../util/types/empty-list-message.type';
import { ItemLanding } from '../../../../../shared/item-landing/item-landing';
import { Tax, TaxStore, taxActions } from '../../../store/tax';
import { SearchItemStore } from '../../../../../../components/layout/store/search-item/search-item.store';
import { Actions, ofType } from '@ngrx/effects';
import { taxGroupActions } from '../../../store/tax-group';

@Component({
  selector: 'app-list-tax',
  imports: [ItemLanding],
  templateUrl: './list-tax.html',
  styleUrl: './list-tax.css'
})
export class ListTax implements OnInit, OnDestroy {
 
  private store = inject(Store);
  protected taxStore = inject(TaxStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private searchItemStore = inject(SearchItemStore);
  // Direct access to signal store properties
  readonly items = this.taxStore.items;
  readonly count = this.taxStore.count;
  readonly pageSize = signal<number>(10);
  readonly currentPage = signal<number>(1);
  private query!:QueryParamsRep;
  private actions$ = inject(Actions);

  readonly error = computed(() => {
    const storeError = this.taxStore.error();
    if (!storeError) return null;
    return storeError;
  });
  readonly handleOnCreateItem = signal<() => void>(() => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/trading/tax/create'], { queryParams: { burl: currentUrl } });
  });

  readonly emptyListMessage = signal<EmptyListMessage>({
    title: 'No tax entries found',
    description: 'Get started by creating your first tax entry.',
    buttonText: 'Create First Tax'
  });

  readonly columns = signal<DbcColumn<Tax>[]>([
    { header: 'Name', key: 'name', type: 'text', sortable: true },
    { header: 'Short Name', key: 'shortname', type: 'text', sortable: true },
    { header: 'Rate (%)', key: 'rate', type: 'number', sortable: true },
    { header: 'Applied To', key: 'appliedto', type: 'number', sortable: true },
    { header: 'Status', key: 'status', type: 'status' },
    { header: 'Description', key: 'description', type: 'text', sortable: true },
    { header: 'Actions', key: 'actions', type: 'action' }
  ]);

  readonly handleOnEditItem = signal<(item: Tax) => void>((item: Tax) => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/trading/tax', item.id, 'edit'], { queryParams: { burl: currentUrl } });
  }); 
  
  readonly handleOnDeleteItem = signal<(item: Tax) => void>((item: Tax) => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/trading/tax', item.id, 'delete'], { queryParams: { burl: currentUrl } });
  });
  readonly countTaxGroupsSuccessEffect = effect((onCleanup) => {

    const subscription = this.actions$.pipe(
      ofType(taxActions.countTaxesSuccess),
      tap(() => {
        this.store.dispatch(taxActions.loadTaxes({}));
      })
    ).subscribe();

    onCleanup(() => subscription.unsubscribe());
  });
  
  private destroy$ = new Subject<void>();

  private loadTaxes(): void {
    this.route.queryParams.pipe(
      distinctUntilChanged(),
      map((params: QueryParamsOriginal) => parseQueryParams(params)),
      takeUntil(this.destroy$)
    ).subscribe((params: QueryParamsRep) => {
      const { limit, offset, page, sort } = params;
      if(this.pageSize() !== limit) {
        this.pageSize.set(limit ?? 10);
      }
      const search = params.search?.length ? params.search : [{query: '', fields: ['description', 'name', 'shortname']}];
      this.query = { limit: limit ?? 10, offset: offset ?? 0, search: search, sort: sort ?? [] };
      if(this.currentPage() !== page) {
        this.currentPage.set(page ?? 1);
      }
      this.store.dispatch(taxActions.countTaxes({ query: this.query }));
      this.store.dispatch(taxActions.loadTaxes({ 
        query: this.query 
      }));
      
    });
  }
  
  ngOnInit(): void {
    this.loadTaxes();
    this.searchItemStore.setCurrentTitle('Tax');
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchItemStore.setCurrentTitle(null);
  }

  readonly handleOnButton2Click = signal<() => void>(() => {
    this.router.navigate(['/app/trading/tax-group']);
  });
}
