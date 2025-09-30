import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import {  Store } from '@ngrx/store';
import { OrganizationStore } from '../../../store/organization/organization.store';
import { ActivatedRoute, Router } from '@angular/router';
import { SearchItemStore } from '../../../../../layout/store/search-item/search-item.store';
import { EmptyListMessage } from '../../../../../../util/types/empty-list-message.type';
import { Organization } from '../../../store/organization/organization.model';
import { DbcColumn } from '../../../../../../util/types/dbc-column.type';
import { ItemLanding } from '../../../../../shared/item-landing/item-landing';
import { Subject } from 'rxjs';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { QueryParamsOriginal, QueryParamsRep } from '../../../../../../util/query-params-util';
import { parseQueryParams } from '../../../../../../util/query-params-util';
import { organizationActions } from '../../../store/organization/organization.actions';

@Component({
  selector: 'app-list-organization',
  imports: [ItemLanding],
  templateUrl: './list-organization.component.html',
  styleUrl: './list-organization.component.css'
})
export class ListOrganizationComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  protected organizationStore = inject(OrganizationStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private searchItemStore = inject(SearchItemStore);
  // Direct access to signal store properties
  readonly items = this.organizationStore.items;
  readonly count = this.organizationStore.count;
  readonly pageSize = signal<number>(10);
  readonly currentPage = signal<number>(1);

  readonly error = computed(() => {
    const storeError = this.organizationStore.error();
    if (!storeError) return null;
    return storeError;
  });
  readonly handleOnCreateItem = signal<() => void>(() => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/management/organization/create'], { queryParams: { burl: currentUrl } });
  });

  readonly emptyListMessage = signal<EmptyListMessage>({
    title: 'No organization entries found',
    description: 'Get started by creating your first organization.',
    buttonText: 'Create First Organization'
  });

  readonly columns = signal<DbcColumn<Organization>[]>([
    { header: 'Name', key: 'name', type: 'text', sortable: true },
    { header: 'E-Mail', key: 'email', type: 'text', sortable: true },
    { header: 'Mobile', key: 'mobile', type: 'text', sortable: true },
    { header: 'Description', key: 'description', type: 'text', sortable: true },
    { header: 'Actions', key: 'actions', type: 'action' }
  ]);

  readonly handleOnEditItem = signal<(item: Organization) => void>((item: Organization) => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/management/organization', item.id, 'edit'], { queryParams: { burl: currentUrl } });
  }); 
  
  readonly handleOnDeleteItem = signal<(item: Organization) => void>((item: Organization) => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/management/organization', item.id, 'delete'], { queryParams: { burl: currentUrl } });
  });

  private destroy$ = new Subject<void>();

  private loadOrganizations(): void {
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
      this.store.dispatch(organizationActions.loadOrganizations({ 
        query: { limit: limit ?? 10, offset: offset ?? 0, search: search, sort: sort ?? [] } 
      }));
      if(this.currentPage() !== page) {
        this.currentPage.set(page ?? 1);
      }
    });
    setTimeout(() => {
      this.store.dispatch(organizationActions.countOrganizations({ query: {} }));
    }, 100);
  }
  
  ngOnInit(): void {
    this.loadOrganizations();
    this.searchItemStore.setCurrentTitle('Organization');
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchItemStore.setCurrentTitle(null);
  }
}
