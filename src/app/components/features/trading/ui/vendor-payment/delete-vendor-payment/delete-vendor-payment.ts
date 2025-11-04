import { Component, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { CancelButton } from '../../../../../shared/cancel-button/cancel-button';
import { DeleteButton } from '../../../../../shared/delete-button/delete-button';
import { ItemNotFound } from '../../../../../shared/item-not-found/item-not-found';
import { SkeltonLoader } from '../../../../../shared/skelton-loader/skelton-loader';
import { vendorPaymentActions, VendorPaymentStore } from '../../../store/vendor-payment';

@Component({
  selector: 'app-delete-vendor-payment',
  imports: [SkeltonLoader, CancelButton, DeleteButton, ItemNotFound],
  templateUrl: './delete-vendor-payment.html',
  styleUrl: './delete-vendor-payment.css'
})
export class DeleteVendorPayment implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly vendorPaymentStore = inject(VendorPaymentStore);
  readonly selectedVendorPayment = this.vendorPaymentStore.selectedItem;
  readonly successAction = vendorPaymentActions.deleteVendorPaymentSuccess;
  protected loading = true;
  private itemId = signal<string | null>(null);
  
  private fetchVendorPaymentEffect = effect(() => {
    this.loading = false;
  });
  
  ngOnInit(): void {
    this.itemId.set(this.route.snapshot.paramMap.get('id') || null);
      if(this.itemId()) {
        this.loading = true;
        this.store.dispatch(vendorPaymentActions.loadVendorPaymentById({ id: this.itemId()!, query: { includes: ['vendor', 'currency', 'bcash'] } }));
      }else{
        this.loading = false;
      }
  }
  handleDelete = (): void => {
    this.store.dispatch(vendorPaymentActions.deleteVendorPayment({ id: this.itemId()! }));
  };
  
  ngOnDestroy() {
    this.fetchVendorPaymentEffect.destroy();
  }
}

