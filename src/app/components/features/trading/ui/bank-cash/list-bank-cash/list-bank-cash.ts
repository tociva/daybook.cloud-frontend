import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { LB4Filter } from '../../../../../../util/lb4-query-builder';
import { DbcColumn } from '../../../../../../util/types/dbc-column.type';
import { EmptyListMessage } from '../../../../../../util/types/empty-list-message.type';
import { ItemLanding } from '../../../../../shared/item-landing/item-landing';
import { BankCash, BankCashStore, bankCashActions } from '../../../store/bank-cash';
import { QueryParamsRep } from '../../../../../../util/query-params-rep';

@Component({
  selector: 'app-list-bank-cash',
  imports: [ItemLanding],
  templateUrl: './list-bank-cash.html',
  styleUrl: './list-bank-cash.css'
})
export class ListBankCash implements OnInit {
  private store = inject(Store);
  protected bankCashStore = inject(BankCashStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Direct access to signal store properties
  readonly items = this.bankCashStore.items;
  readonly count = this.bankCashStore.count;
  readonly pageSize = signal<number>(10);
  readonly currentPage = signal<number>(1);

  readonly error = computed(() => {
    const storeError = this.bankCashStore.error();
    if (!storeError) return null;
    return storeError;
  });
  readonly handleOnCreateItem = signal<() => void>(() => {
    const currentUrl = this.router.url;
    this.router.navigate(['/trading/bank-cash/create'], { queryParams: { burl: currentUrl } });
  });

  readonly emptyListMessage = signal<EmptyListMessage>({
    title: 'No bank/cash entries found',
    description: 'Get started by creating your first bank or cash account.',
    buttonText: 'Create First Bank/Cash'
  });

  readonly columns = signal<DbcColumn<BankCash>[]>([
    { header: 'Name', key: 'name', type: 'text' },
    { header: 'Status', key: 'status', type: 'status' },
    { header: 'Description', key: 'description', type: 'text' },
    { header: 'Actions', key: 'actions', type: 'action' }
  ]);

  readonly handleOnEditItem = signal<(item: BankCash) => void>((item: BankCash) => {
    const currentUrl = this.router.url;
    this.router.navigate(['/trading/bank-cash/edit', item.id], { queryParams: { burl: currentUrl } });
  }); 
  
  readonly handleOnDeleteItem = signal<(item: BankCash) => void>((item: BankCash) => {
    const currentUrl = this.router.url;
    this.router.navigate(['/trading/bank-cash/delete', item.id], { queryParams: { burl: currentUrl } });
  });

  private destroy$ = new Subject<void>();

  private loadBankCashes(): void {
    this.route.queryParams.pipe(
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((params: QueryParamsRep) => {
      const { limit, offset, page } = params;
      this.store.dispatch(bankCashActions.loadBankCashes({ 
        query: { limit: limit ?? 10, offset: offset ?? 0 } 
      }));
      this.currentPage.set(page ?? 1);
    });
    setTimeout(() => {
      this.store.dispatch(bankCashActions.countBankCashes({ query: {} }));
    }, 100);
  }
  
  ngOnInit(): void {
    this.loadBankCashes();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onCreateBankCash(): void {
    const currentUrl = this.router.url;
    this.router.navigate(['/trading/bank-cash/create'], { queryParams: { burl: currentUrl } });
  }
}