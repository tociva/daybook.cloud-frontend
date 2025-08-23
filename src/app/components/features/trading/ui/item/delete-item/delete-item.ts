import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { CancelButton } from '../../../../../shared/cancel-button/cancel-button';
import { DeleteButton } from '../../../../../shared/delete-button/delete-button';
import { ItemNotFound } from '../../../../../shared/item-not-found/item-not-found';
import { SkeltonLoader } from '../../../../../shared/skelton-loader/skelton-loader';
import { itemActions, ItemStore } from '../../../store/item';

@Component({
  selector: 'app-delete-item',
  imports: [SkeltonLoader, CancelButton, DeleteButton, ItemNotFound],
  templateUrl: './delete-item.html',
  styleUrl: './delete-item.css'
})
export class DeleteItem {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly itemStore = inject(ItemStore);
  readonly selectedItem = this.itemStore.selectedItem;
  readonly successAction = itemActions.deleteItemSuccess;
  protected loading = true;
  private itemId = signal<string | null>(null);
  
  private fetchItemEffect = effect(() => {
    this.loading = false;
  });
  
  ngOnInit(): void {
    this.itemId.set(this.route.snapshot.paramMap.get('id') || null);
      if(this.itemId()) {
        this.loading = true;
        this.store.dispatch(itemActions.loadItemById({ id: this.itemId()! }));
      }else{
        this.loading = false;
      }
  }
  handleDelete = (): void => {
    this.store.dispatch(itemActions.deleteItem({ id: this.itemId()! }));
  };
  onDestroy() {
    this.fetchItemEffect.destroy();
  }
}
