import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { ItemLanding } from '../../../../../shared/item-landing/item-landing';
import { BankCash, BankCashStore, bankCashActions } from '../../../store/bank-cash';
import { EmptyListMessage } from '../../../../../../util/types/empty-list-message.type';
import { DbcColumn } from '../../../../../../util/types/dbc-column.type';

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

  // Direct access to signal store properties
  readonly items = this.bankCashStore.items;
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

  ngOnInit(): void {
    this.loadBankCashes();
  }

  loadBankCashes(): void {
    this.store.dispatch(bankCashActions.loadBankCashes({ query: {} }));
  }

  onCreateBankCash(): void {
    const currentUrl = this.router.url;
    this.router.navigate(['/trading/bank-cash/create'], { queryParams: { burl: currentUrl } });
  }
}