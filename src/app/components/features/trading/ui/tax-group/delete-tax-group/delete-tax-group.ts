import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { CancelButton } from '../../../../../shared/cancel-button/cancel-button';
import { DeleteButton } from '../../../../../shared/delete-button/delete-button';
import { ItemNotFound } from '../../../../../shared/item-not-found/item-not-found';
import { SkeltonLoader } from '../../../../../shared/skelton-loader/skelton-loader';
import { taxGroupActions, TaxGroupStore } from '../../../store/tax-group';

@Component({
  selector: 'app-delete-tax-group',
  imports: [SkeltonLoader, CancelButton, DeleteButton, ItemNotFound],
  templateUrl: './delete-tax-group.html',
  styleUrl: './delete-tax-group.css'
})
export class DeleteTaxGroup {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly taxGroupStore = inject(TaxGroupStore);
  readonly selectedTaxGroup = this.taxGroupStore.selectedItem;
  readonly successAction = taxGroupActions.deleteTaxGroupSuccess;
  protected loading = true;
  private taxGroupId = signal<string | null>(null);
  
  private fetchTaxGroupEffect = effect(() => {
    this.loading = false;
  });
  
  ngOnInit(): void {
    this.taxGroupId.set(this.route.snapshot.paramMap.get('id') || null);
      if(this.taxGroupId()) {
        this.loading = true;
        this.store.dispatch(taxGroupActions.loadTaxGroupById({ id: this.taxGroupId()! }));
      }else{
        this.loading = false;
      }
  }
  handleDelete = (): void => {
    this.store.dispatch(taxGroupActions.deleteTaxGroup({ id: this.taxGroupId()! }));
  };
  onDestroy() {
    this.fetchTaxGroupEffect.destroy();
  }
}
