import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { CancelButton } from '../../../../../shared/cancel-button/cancel-button';
import { DeleteButton } from '../../../../../shared/delete-button/delete-button';
import { ItemNotFound } from '../../../../../shared/item-not-found/item-not-found';
import { SkeltonLoader } from '../../../../../shared/skelton-loader/skelton-loader';
import { bankCashActions, BankCashStore } from '../../../store/bank-cash';

@Component({
  selector: 'app-delete-bank-cash',
  imports: [SkeltonLoader, CancelButton, DeleteButton, ItemNotFound],
  templateUrl: './delete-bank-cash.html',
  styleUrl: './delete-bank-cash.css'
})
export class DeleteBankCash {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly bankCashStore = inject(BankCashStore);
  readonly selectedBankCash = this.bankCashStore.selectedItem;
  readonly successAction = bankCashActions.deleteBankCashSuccess;
  protected loading = true;
  private itemId = signal<string | null>(null);
  
  private fetchBankCashEffect = effect(() => {
    this.loading = false;
  });
  
  ngOnInit(): void {
    this.itemId.set(this.route.snapshot.paramMap.get('id') || null);
      if(this.itemId()) {
        this.loading = true;
        this.store.dispatch(bankCashActions.loadBankCashById({ id: this.itemId()! }));
      }else{
        this.loading = false;
      }
  }
  handleDelete = (): void => {
    this.store.dispatch(bankCashActions.deleteBankCash({ id: this.itemId()! }));
  };
  ngOnDestroy() {
    this.fetchBankCashEffect.destroy();
  }
}
