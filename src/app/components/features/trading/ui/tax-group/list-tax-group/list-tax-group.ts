import { Component, computed, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { ItemLanding } from '../../../../../shared/item-landing/item-landing';
import { DbcColumn } from '../../../../../../util/types/dbc-column.type';
import { EmptyListMessage } from '../../../../../../util/types/empty-list-message.type';
import { taxGroupActions, TaxGroupStore } from '../../../store/tax-group';
import { SearchItemStore } from '../../../../../../components/layout/store/search-item/search-item.store';
import { Actions } from '@ngrx/effects';
import { ofType } from '@ngrx/effects';
import { tap } from 'rxjs';

@Component({
  selector: 'app-list-tax-group',
  imports: [ItemLanding],
  templateUrl: './list-tax-group.html',
  styleUrl: './list-tax-group.css'
})
export class ListTaxGroup implements OnInit, OnDestroy {
 
  private actions$ = inject(Actions);
  private store = inject(Store);
  protected taxGroupStore = inject(TaxGroupStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private searchItemStore = inject(SearchItemStore);
  // Direct access to signal store properties
  readonly items = this.taxGroupStore.items;
  readonly count = this.taxGroupStore.count;
  readonly pageSize = signal<number>(10);
  readonly currentPage = signal<number>(1);

  readonly error = computed(() => {
    const storeError = this.taxGroupStore.error();
    if (!storeError) return null;
    return storeError;
  });
  readonly handleOnCreateItem = signal<() => void>(() => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/trading/tax-group/create'], { queryParams: { burl: currentUrl } });
  });

  readonly emptyListMessage = signal<EmptyListMessage>({
    title: 'No tax group entries found',
    description: 'Get started by creating your first tax group entry.',
    buttonText: 'Create First Tax Group'
  });

  readonly columns = signal<DbcColumn<any>[]>([
    { header: 'Name', key: 'name', type: 'text', sortable: true },
    { header: 'Rate (%)', key: 'rate', type: 'text', sortable: true },
    { header: 'Description', key: 'description', type: 'text', sortable: true },
    { header: 'Actions', key: 'actions', type: 'action' }
  ]);

  readonly handleOnEditItem = signal<(item: any) => void>((item: any) => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/trading/tax-group', item.id, 'edit'], { queryParams: { burl: currentUrl } });
  }); 
  
  readonly handleOnDeleteItem = signal<(item: any) => void>((item: any) => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/trading/tax-group', item.id, 'delete'], { queryParams: { burl: currentUrl } });
  });

  readonly handleOnButton2Click = signal<() => void>(() => {
    this.router.navigate(['/app/trading/tax']);
  });

  readonly countTaxGroupsSuccessEffect = effect((onCleanup) => {

    // Normalize to array
    
    const subscription = this.actions$.pipe(
      ofType(taxGroupActions.countTaxGroupsSuccess),
      tap(() => {
        this.store.dispatch(taxGroupActions.loadTaxGroups({}));
      })
    ).subscribe();

    onCleanup(() => subscription.unsubscribe());
  });

  ngOnInit(): void {
    // Load tax groups on component initialization
    this.store.dispatch(taxGroupActions.loadTaxGroups({}));
    this.store.dispatch(taxGroupActions.countTaxGroups({}));
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }
}
