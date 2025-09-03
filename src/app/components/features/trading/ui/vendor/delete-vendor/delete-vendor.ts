import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { CancelButton } from '../../../../../shared/cancel-button/cancel-button';
import { DeleteButton } from '../../../../../shared/delete-button/delete-button';
import { ItemNotFound } from '../../../../../shared/item-not-found/item-not-found';
import { SkeltonLoader } from '../../../../../shared/skelton-loader/skelton-loader';
import { vendorActions, VendorStore } from '../../../store/vendor';

@Component({
  selector: 'app-delete-vendor',
  imports: [SkeltonLoader, CancelButton, DeleteButton, ItemNotFound],
  templateUrl: './delete-vendor.html',
  styleUrl: './delete-vendor.css'
})
export class DeleteVendor {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly vendorStore = inject(VendorStore);
  readonly selectedVendor = this.vendorStore.selectedItem;
  readonly successAction = vendorActions.deleteVendorSuccess;
  protected loading = true;
  private itemId = signal<string | null>(null);
  
  private fetchVendorEffect = effect(() => {
    this.loading = false;
  });
  
  ngOnInit(): void {
    this.itemId.set(this.route.snapshot.paramMap.get('id') || null);
      if(this.itemId()) {
        this.loading = true;
        this.store.dispatch(vendorActions.loadVendorById({ id: this.itemId()! }));
      }else{
        this.loading = false;
      }
  }
  handleDelete = (): void => {
    this.store.dispatch(vendorActions.deleteVendor({ id: this.itemId()! }));
  };
  onDestroy() {
    this.fetchVendorEffect.destroy();
  }
}
