import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { CancelButton } from '../../../../../shared/cancel-button/cancel-button';
import { DeleteButton } from '../../../../../shared/delete-button/delete-button';
import { ItemNotFound } from '../../../../../shared/item-not-found/item-not-found';
import { SkeltonLoader } from '../../../../../shared/skelton-loader/skelton-loader';
import { itemCategoryActions, ItemCategoryStore } from '../../../store/item-category';

@Component({
  selector: 'app-delete-item-category',
  imports: [SkeltonLoader, CancelButton, DeleteButton, ItemNotFound],
  templateUrl: './delete-item-category.html',
  styleUrl: './delete-item-category.css'
})
export class DeleteItemCategory {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly itemCategoryStore = inject(ItemCategoryStore);
  readonly selectedItemCategory = this.itemCategoryStore.selectedItem;
  readonly successAction = itemCategoryActions.deleteItemCategorySuccess;
  protected loading = true;
  private itemId = signal<string | null>(null);
  
  private fetchItemCategoryEffect = effect(() => {
    this.loading = false;
  });
  
  ngOnInit(): void {
    this.itemId.set(this.route.snapshot.paramMap.get('id') || null);
      if(this.itemId()) {
        this.loading = true;
        this.store.dispatch(itemCategoryActions.loadItemCategoryById({ id: this.itemId()! }));
      }else{
        this.loading = false;
      }
  }
  handleDelete = (): void => {
    this.store.dispatch(itemCategoryActions.deleteItemCategory({ id: this.itemId()! }));
  };
  
  ngOnDestroy() {
    this.fetchItemCategoryEffect.destroy();
  }
}
