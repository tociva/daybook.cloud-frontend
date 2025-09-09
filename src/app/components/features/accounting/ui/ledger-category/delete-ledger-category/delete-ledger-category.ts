import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { CancelButton } from '../../../../../shared/cancel-button/cancel-button';
import { DeleteButton } from '../../../../../shared/delete-button/delete-button';
import { ItemNotFound } from '../../../../../shared/item-not-found/item-not-found';
import { SkeltonLoader } from '../../../../../shared/skelton-loader/skelton-loader';
import { ledgerCategoryActions, LedgerCategoryStore } from '../../../store/ledger-category';

@Component({
  selector: 'app-delete-ledger-category',
  imports: [SkeltonLoader, CancelButton, DeleteButton, ItemNotFound],
  templateUrl: './delete-ledger-category.html',
  styleUrl: './delete-ledger-category.css'
})
export class DeleteLedgerCategory implements OnInit {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly ledgerCategoryStore = inject(LedgerCategoryStore);
  readonly selectedLedgerCategory = this.ledgerCategoryStore.selectedItem;
  readonly successAction = ledgerCategoryActions.deleteLedgerCategorySuccess;
  protected loading = true;
  private ledgerCategoryId = signal<string | null>(null);
  
  private fetchLedgerCategoryEffect = effect(() => {
    this.loading = false;
  });
  
  ngOnInit(): void {
    this.ledgerCategoryId.set(this.route.snapshot.paramMap.get('id') || null);
    if (this.ledgerCategoryId()) {
      this.loading = true;
      this.store.dispatch(ledgerCategoryActions.loadLedgerCategoryById({ 
        id: this.ledgerCategoryId()!, 
        query: { includes: ['parent', 'fiscalyear'] } 
      }));
    } else {
      this.loading = false;
    }
  }

  handleDelete = (): void => {
    this.store.dispatch(ledgerCategoryActions.deleteLedgerCategory({ id: this.ledgerCategoryId()! }));
  };

  onDestroy() {
    this.fetchLedgerCategoryEffect.destroy();
  }
}
