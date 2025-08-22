import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { CancelButton } from '../../../../../shared/cancel-button/cancel-button';
import { DeleteButton } from '../../../../../shared/delete-button/delete-button';
import { ItemNotFound } from '../../../../../shared/item-not-found/item-not-found';
import { SkeltonLoader } from '../../../../../shared/skelton-loader/skelton-loader';
import { customerActions, CustomerStore } from '../../../store/customer';

@Component({
  selector: 'app-delete-customer',
  imports: [SkeltonLoader, CancelButton, DeleteButton, ItemNotFound],
  templateUrl: './delete-customer.html',
  styleUrl: './delete-customer.css'
})
export class DeleteCustomer {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly customerStore = inject(CustomerStore);
  readonly selectedCustomer = this.customerStore.selectedItem;
  readonly successAction = customerActions.deleteCustomerSuccess;
  protected loading = true;
  private itemId = signal<string | null>(null);
  
  private fetchCustomerEffect = effect(() => {
    this.loading = false;
  });
  
  ngOnInit(): void {
    this.itemId.set(this.route.snapshot.paramMap.get('id') || null);
      if(this.itemId()) {
        this.loading = true;
        this.store.dispatch(customerActions.loadCustomerById({ id: this.itemId()! }));
      }else{
        this.loading = false;
      }
  }
  handleDelete = (): void => {
    this.store.dispatch(customerActions.deleteCustomer({ id: this.itemId()! }));
  };
  onDestroy() {
    this.fetchCustomerEffect.destroy();
  }
}
