import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { CancelButton } from '../../../../../shared/cancel-button/cancel-button';
import { DeleteButton } from '../../../../../shared/delete-button/delete-button';
import { ItemNotFound } from '../../../../../shared/item-not-found/item-not-found';
import { SkeltonLoader } from '../../../../../shared/skelton-loader/skelton-loader';
import { customerReceiptActions, CustomerReceiptStore } from '../../../store/customer-receipt';

@Component({
  selector: 'app-delete-customer-receipt',
  imports: [SkeltonLoader, CancelButton, DeleteButton, ItemNotFound],
  templateUrl: './delete-customer-receipt.html',
  styleUrl: './delete-customer-receipt.css'
})
export class DeleteCustomerReceipt {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly customerReceiptStore = inject(CustomerReceiptStore);
  readonly selectedCustomerReceipt = this.customerReceiptStore.selectedItem;
  readonly successAction = customerReceiptActions.deleteCustomerReceiptSuccess;
  protected loading = true;
  private itemId = signal<string | null>(null);
  
  private fetchCustomerReceiptEffect = effect(() => {
    this.loading = false;
  });
  
  ngOnInit(): void {
    this.itemId.set(this.route.snapshot.paramMap.get('id') || null);
      if(this.itemId()) {
        this.loading = true;
        this.store.dispatch(customerReceiptActions.loadCustomerReceiptById({ id: this.itemId()!, query: { includes: ['customer', 'currency', 'bcash'] } }));
      }else{
        this.loading = false;
      }
  }
  handleDelete = (): void => {
    this.store.dispatch(customerReceiptActions.deleteCustomerReceipt({ id: this.itemId()! }));
  };
  
  ngOnDestroy() {
    this.fetchCustomerReceiptEffect.destroy();
  }
}

