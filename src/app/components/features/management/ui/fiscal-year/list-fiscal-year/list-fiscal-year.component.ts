import { Component, computed, inject, signal } from '@angular/core';
import { ItemLanding } from '../../../../../shared/item-landing/item-landing';
import { Store } from '@ngrx/store';
import { FiscalYearStore } from '../../../store/fiscal-year/fiscal-year.store';
import { ActivatedRoute, Router } from '@angular/router';
import { SearchItemStore } from '../../../../../layout/store/search-item/search-item.store';
import { EmptyListMessage } from '../../../../../../util/types/empty-list-message.type';
import { FiscalYear } from '../../../store/fiscal-year/fiscal-year.model';
import { DbcColumn } from '../../../../../../util/types/dbc-column.type';
import { distinctUntilChanged, map, Subject, takeUntil } from 'rxjs';
import { parseQueryParams, QueryParamsOriginal, QueryParamsRep } from '../../../../../../util/query-params-util';
import { fiscalYearActions } from '../../../store/fiscal-year/fiscal-year.actions';

@Component({
  selector: 'app-list-fiscal-year',
  imports: [ItemLanding],
  templateUrl: './list-fiscal-year.component.html',
  styleUrl: './list-fiscal-year.component.css'
})
export class ListFiscalYearComponent {
  private store = inject(Store);
  protected fiscalYearStore = inject(FiscalYearStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private searchItemStore = inject(SearchItemStore);
  // Direct access to signal store properties
  readonly items = this.fiscalYearStore.items;
  readonly count = this.fiscalYearStore.count;
  readonly pageSize = signal<number>(10);
  readonly currentPage = signal<number>(1);

  readonly error = computed(() => {
    const storeError = this.fiscalYearStore.error();
    if (!storeError) return null;
    return storeError;
  });
  readonly handleOnCreateItem = signal<() => void>(() => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/management/fiscal-year/create'], { queryParams: { burl: currentUrl } });
  });

  readonly emptyListMessage = signal<EmptyListMessage>({
    title: 'No fiscal year entries found',
    description: 'Get started by creating your first fiscal year.',
    buttonText: 'Create First Fiscal Year'
  });

  readonly columns = signal<DbcColumn<FiscalYear>[]>([
    { header: 'Name', key: 'name', type: 'text', sortable: true },
    { header: 'Description', key: 'description', type: 'text', sortable: true },
    { header: 'Actions', key: 'actions', type: 'action' }
  ]);

  readonly handleOnEditItem = signal<(item: FiscalYear) => void>((item: FiscalYear) => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/management/fiscal-year', item.id, 'edit'], { queryParams: { burl: currentUrl } });
  }); 
  
  readonly handleOnDeleteItem = signal<(item: FiscalYear) => void>((item: FiscalYear) => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/management/fiscal-year', item.id, 'delete'], { queryParams: { burl: currentUrl } });
  });

  private destroy$ = new Subject<void>();

  private loadFiscalYears(): void {
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
      this.store.dispatch(fiscalYearActions.loadFiscalYears({ 
        query: { limit: limit ?? 10, offset: offset ?? 0, search: search, sort: sort ?? [] } 
      }));
      if(this.currentPage() !== page) {
        this.currentPage.set(page ?? 1);
      }
    });
    setTimeout(() => {
        this.store.dispatch(fiscalYearActions.countFiscalYears({ query: {} }));
    }, 100);
  }
  
  ngOnInit(): void {
    this.loadFiscalYears();
    this.searchItemStore.setCurrentTitle('Fiscal Year');
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchItemStore.setCurrentTitle(null);
  }
}
