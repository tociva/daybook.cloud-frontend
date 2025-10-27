import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { CancelButton } from '../../../../../shared/cancel-button/cancel-button';
import { DeleteButton } from '../../../../../shared/delete-button/delete-button';
import { ItemNotFound } from '../../../../../shared/item-not-found/item-not-found';
import { SkeltonLoader } from '../../../../../shared/skelton-loader/skelton-loader';
import { taxActions, TaxStore } from '../../../store/tax';

@Component({
  selector: 'app-delete-tax',
  imports: [SkeltonLoader, CancelButton, DeleteButton, ItemNotFound],
  templateUrl: './delete-tax.html',
  styleUrl: './delete-tax.css'
})
export class DeleteTax {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly taxStore = inject(TaxStore);
  readonly selectedTax = this.taxStore.selectedItem;
  readonly successAction = taxActions.deleteTaxSuccess;
  protected loading = true;
  private itemId = signal<string | null>(null);
  
  private fetchTaxEffect = effect(() => {
    this.loading = false;
  });
  
  ngOnInit(): void {
    this.itemId.set(this.route.snapshot.paramMap.get('id') || null);
      if(this.itemId()) {
        this.loading = true;
        this.store.dispatch(taxActions.loadTaxById({ id: this.itemId()! }));
      }else{
        this.loading = false;
      }
  }
  handleDelete = (): void => {
    this.store.dispatch(taxActions.deleteTax({ id: this.itemId()! }));
  };
  
  ngOnDestroy() {
    this.fetchTaxEffect.destroy();
  }
}
