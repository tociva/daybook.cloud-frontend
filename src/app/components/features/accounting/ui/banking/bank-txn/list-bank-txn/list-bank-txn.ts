import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { distinctUntilChanged, map, takeUntil } from 'rxjs/operators';
import { QueryParamsOriginal, QueryParamsRep, parseQueryParams } from '../../../../../../../util/query-params-util';
import { DbcColumn } from '../../../../../../../util/types/dbc-column.type';
import { EmptyListMessage } from '../../../../../../../util/types/empty-list-message.type';
import { ItemLanding } from '../../../../../../shared/item-landing/item-landing';
import { BankTxn, BankTxnStore, bankTxnActions } from '../../../../store/bank-txn';
import { SearchItemStore } from '../../../../../../../components/layout/store/search-item/search-item.store';

@Component({
  selector: 'app-list-bank-txn',
  imports: [ItemLanding],
  templateUrl: './list-bank-txn.html',
  styleUrl: './list-bank-txn.css'
})
export class ListBankTxn implements OnInit, OnDestroy {
 
  private store = inject(Store);
  protected bankTxnStore = inject(BankTxnStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private searchItemStore = inject(SearchItemStore);
  // Direct access to signal store properties
  readonly bankTxns = this.bankTxnStore.items;
  readonly count = this.bankTxnStore.count;
  readonly pageSize = signal<number>(10);
  readonly currentPage = signal<number>(1);

  readonly error = computed(() => {
    const storeError = this.bankTxnStore.error();
    if (!storeError) return null;
    return storeError;
  });
  readonly handleOnCreateItem = signal<() => void>(() => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/accounting/banking/bank-txn/create'], { queryParams: { burl: currentUrl } });
  });

  readonly emptyListMessage = signal<EmptyListMessage>({
    title: 'No bank transactions found',
    description: 'Get started by creating your first bank transaction.',
    buttonText: 'Create First Bank Transaction'
  });

  readonly columns = signal<DbcColumn<BankTxn>[]>([
    { header: 'Date', key: 'txndate', type: 'date', sortable: true },
    { header: 'Bank/Cash Ledger', key: 'bankcashledgermap.ledger.name', type: 'text', sortable: true },
    { header: 'Debit', key: 'debit', type: 'number', sortable: true },
    { header: 'Credit', key: 'credit', type: 'number', sortable: true },
    { header: 'Description', key: 'description', type: 'text', sortable: true },
    { header: 'Bank Ref', key: 'bankref', type: 'text', sortable: true },
    { header: 'Actions', key: 'actions', type: 'action' }
  ]);

  readonly handleOnEditItem = signal<(bankTxn: BankTxn) => void>((bankTxn: BankTxn) => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/accounting/banking/bank-txn', bankTxn.id, 'edit'], { queryParams: { burl: currentUrl } });
  }); 
  
  readonly handleOnDeleteItem = signal<(bankTxn: BankTxn) => void>((bankTxn: BankTxn) => {
    const currentUrl = this.router.url;
    this.router.navigate(['/app/accounting/banking/bank-txn', bankTxn.id, 'delete'], { queryParams: { burl: currentUrl } });
  });

  readonly handleOnButton2Click = signal<() => void>(() => {
    this.router.navigate(['/app/accounting/banking/bank-ledger-map']);
  });

  private destroy$ = new Subject<void>();

  private loadBankTxns(): void {
    this.route.queryParams.pipe(
      distinctUntilChanged(),
      map((params: QueryParamsOriginal) => parseQueryParams(params)),
      takeUntil(this.destroy$)
    ).subscribe((params: QueryParamsRep) => {
      const { limit, offset, page, sort } = params;
      if(this.pageSize() !== limit) {
        this.pageSize.set(limit ?? 10);
      }
      const search = params.search?.length ? params.search : [{query: '', fields: ['description', 'bankref']}];
      this.store.dispatch(bankTxnActions.loadBankTxns({ 
        query: { limit: limit ?? 10, offset: offset ?? 0, search: search, sort: sort ?? [], includes: ['bankcashledgermap.ledger'] } 
      }));
      if(this.currentPage() !== page) {
        this.currentPage.set(page ?? 1);
      }
    });
    setTimeout(() => {
      this.store.dispatch(bankTxnActions.countBankTxns({ query: {} }));
    }, 100);
  }
  
  ngOnInit(): void {
    this.loadBankTxns();
    this.searchItemStore.setCurrentTitle('Bank Transactions');
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchItemStore.setCurrentTitle(null);
  }

  handleOnFilesSelected(files: File[]): void {
    const [file] = files;
    this.store.dispatch(bankTxnActions.uploadBulkBankTxns({ file }));
  }
}
