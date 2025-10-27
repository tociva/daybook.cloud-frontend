import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { CancelButton } from '../../../../../shared/cancel-button/cancel-button';
import { DeleteButton } from '../../../../../shared/delete-button/delete-button';
import { ItemNotFound } from '../../../../../shared/item-not-found/item-not-found';
import { SkeltonLoader } from '../../../../../shared/skelton-loader/skelton-loader';
import { ledgerActions, LedgerStore } from '../../../store/ledger';

@Component({
  selector: 'app-delete-ledger',
  imports: [SkeltonLoader, CancelButton, DeleteButton, ItemNotFound],
  templateUrl: './delete-ledger.html',
  styleUrl: './delete-ledger.css'
})
export class DeleteLedger implements OnInit {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly ledgerStore = inject(LedgerStore);
  readonly selectedLedger = this.ledgerStore.selectedItem;
  readonly successAction = ledgerActions.deleteLedgerSuccess;
  protected loading = true;
  private ledgerId = signal<string | null>(null);
  
  private fetchLedgerEffect = effect(() => {
    this.loading = false;
  });
  
  ngOnInit(): void {
    this.ledgerId.set(this.route.snapshot.paramMap.get('id') || null);
    if (this.ledgerId()) {
      this.loading = true;
      this.store.dispatch(ledgerActions.loadLedgerById({ 
        id: this.ledgerId()!, 
        query: { includes: ['category', 'fiscalyear'] } 
      }));
    } else {
      this.loading = false;
    }
  }

  handleDelete = (): void => {
    this.store.dispatch(ledgerActions.deleteLedger({ id: this.ledgerId()! }));
  };

  ngOnDestroy() {
    this.fetchLedgerEffect.destroy();
  }
}
