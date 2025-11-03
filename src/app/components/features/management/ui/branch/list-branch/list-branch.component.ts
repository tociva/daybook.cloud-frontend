import { Component, computed, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { distinctUntilChanged, map, takeUntil } from 'rxjs/operators';
import { DbcColumn } from '../../../../../../util/types/dbc-column.type';
import { EmptyListMessage } from '../../../../../../util/types/empty-list-message.type';
import { SearchItemStore } from '../../../../../layout/store/search-item/search-item.store';
import { ItemLanding } from '../../../../../shared/item-landing/item-landing';
import { branchActions } from '../../../store/branch/branch.actions';
import { Branch } from '../../../store/branch/branch.model';
import { BranchStore } from '../../../store/branch/branch.store';
import { QueryParamsOriginal } from '../../../../../../util/query-params-util';
import { parseQueryParams } from '../../../../../../util/query-params-util';
import { QueryParamsRep } from '../../../../../../util/query-params-util';

@Component({
  selector: 'app-list-branch',
  imports: [ItemLanding],
  templateUrl: './list-branch.component.html',
  styleUrl: './list-branch.component.css'
})
export class ListBranchComponent {
  private store = inject(Store);
  protected branchStore = inject(BranchStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private searchItemStore = inject(SearchItemStore);
  // Direct access to signal store properties
  readonly items = this.branchStore.items;
  readonly count = this.branchStore.count;
  readonly pageSize = signal<number>(10);
  readonly currentPage = signal<number>(1);

  readonly error = computed(() => {
    const storeError = this.branchStore.error();
    if (!storeError) return null;
    return storeError;
  });
  readonly handleOnCreateItem = signal<() => void>(() => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/management/branch/create'], { queryParams: { burl: currentUrl } });
  });

  readonly emptyListMessage = signal<EmptyListMessage>({
    title: 'No branch entries found',
    description: 'Get started by creating your first branch.',
    buttonText: 'Create First Branch'
  });

  readonly columns = signal<DbcColumn<Branch>[]>([
    { header: 'Name', key: 'name', type: 'text', sortable: true },
    { header: 'E-Mail', key: 'email', type: 'text', sortable: true },
    { header: 'Mobile', key: 'mobile', type: 'text', sortable: true },
    { header: 'Description', key: 'description', type: 'text', sortable: true },
    { header: 'Actions', key: 'actions', type: 'action' }
  ]);

  readonly handleOnEditItem = signal<(item: Branch) => void>((item: Branch) => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/management/branch', item.id, 'edit'], { queryParams: { burl: currentUrl } });
  }); 
  
  readonly handleOnDeleteItem = signal<(item: Branch) => void>((item: Branch) => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/management/branch', item.id, 'delete'], { queryParams: { burl: currentUrl } });
  });

  private destroy$ = new Subject<void>();

  private loadBranches(): void {
    this.route.queryParams.pipe(
      distinctUntilChanged(),
      map((params: QueryParamsOriginal) => parseQueryParams(params)),
      takeUntil(this.destroy$)
    ).subscribe((params: QueryParamsRep) => {
      const { limit, offset, page, sort } = params;
      if(this.pageSize() !== limit) {
        this.pageSize.set(limit ?? 10);
      }
      const search = params.search?.length ? params.search : [{query: '', fields: ['description', 'name']}];
      this.store.dispatch(branchActions.loadBranches({ 
        query: { limit: limit ?? 10, offset: offset ?? 0, search: search, sort: sort ?? [] } 
      }));
      if(this.currentPage() !== page) {
        this.currentPage.set(page ?? 1);
      }
    });
    setTimeout(() => {
        this.store.dispatch(branchActions.countBranches({ query: {} }));
    }, 100);
  }
  
  ngOnInit(): void {
    this.loadBranches();
    this.searchItemStore.setCurrentTitle('Branch');
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchItemStore.setCurrentTitle(null);
  }
}
