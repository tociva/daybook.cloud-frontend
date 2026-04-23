import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { CancelButton } from '../../../../../../shared/cancel-button/cancel-button';
import { DeleteButton } from '../../../../../../shared/delete-button/delete-button';
import { ItemNotFound } from '../../../../../../shared/item-not-found/item-not-found';
import { SkeltonLoader } from '../../../../../../shared/skelton-loader/skelton-loader';
import { bankTxnActions, BankTxnStore } from '../../../../store/bank-txn';

@Component({
  selector: 'app-delete-bank-txn',
  imports: [SkeltonLoader, CancelButton, DeleteButton, ItemNotFound],
  templateUrl: './delete-bank-txn.html',
  styleUrl: './delete-bank-txn.css'
})
export class DeleteBankTxn implements OnInit {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly bankTxnStore = inject(BankTxnStore);
  readonly selectedBankTxn = this.bankTxnStore.selectedItem;
  readonly successAction = bankTxnActions.deleteBankTxnSuccess;
  protected loading = true;
  private bankTxnId = signal<string | null>(null);
  
  private fetchBankTxnEffect = effect(() => {
    this.loading = false;
  });
  
  ngOnInit(): void {
    this.bankTxnId.set(this.route.snapshot.paramMap.get('id') || null);
    if (this.bankTxnId()) {
      this.loading = true;
      this.store.dispatch(bankTxnActions.loadBankTxnById({ 
        id: this.bankTxnId()!, 
        query: { includes: ['bankcashledgermap', 'fiscalyear'] } 
      }));
    } else {
      this.loading = false;
    }
  }

  handleDelete = (): void => {
    this.store.dispatch(bankTxnActions.deleteBankTxn({ id: this.bankTxnId()! }));
  };

  ngOnDestroy() {
    this.fetchBankTxnEffect.destroy();
  }
}


