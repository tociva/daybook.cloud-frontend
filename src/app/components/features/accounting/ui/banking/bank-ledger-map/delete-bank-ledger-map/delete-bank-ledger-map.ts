import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { CancelButton } from '../../../../../../shared/cancel-button/cancel-button';
import { DeleteButton } from '../../../../../../shared/delete-button/delete-button';
import { ItemNotFound } from '../../../../../../shared/item-not-found/item-not-found';
import { SkeltonLoader } from '../../../../../../shared/skelton-loader/skelton-loader';
import { bankLedgerMapActions, BankLedgerMapStore } from '../../../../store/bank-ledger-map';

@Component({
  selector: 'app-delete-bank-ledger-map',
  imports: [SkeltonLoader, CancelButton, DeleteButton, ItemNotFound],
  templateUrl: './delete-bank-ledger-map.html',
  styleUrl: './delete-bank-ledger-map.css'
})
export class DeleteBankLedgerMap implements OnInit {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly bankLedgerMapStore = inject(BankLedgerMapStore);
  readonly selectedBankLedgerMap = this.bankLedgerMapStore.selectedItem;
  readonly successAction = bankLedgerMapActions.deleteBankLedgerMapSuccess;
  protected loading = true;
  private bankLedgerMapId = signal<string | null>(null);
  
  private fetchBankLedgerMapEffect = effect(() => {
    this.loading = false;
  });
  
  ngOnInit(): void {
    this.bankLedgerMapId.set(this.route.snapshot.paramMap.get('id') || null);
    if (this.bankLedgerMapId()) {
      this.loading = true;
      this.store.dispatch(bankLedgerMapActions.loadBankLedgerMapById({ 
        id: this.bankLedgerMapId()!, 
        query: { includes: ['fiscalyear', 'bankcash', 'ledger'] } 
      }));
    } else {
      this.loading = false;
    }
  }

  handleDelete = (): void => {
    this.store.dispatch(bankLedgerMapActions.deleteBankLedgerMap({ id: this.bankLedgerMapId()! }));
  };

  ngOnDestroy() {
    this.fetchBankLedgerMapEffect.destroy();
  }
}

