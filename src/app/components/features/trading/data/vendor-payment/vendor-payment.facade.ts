import { Injectable, inject } from '@angular/core';
import { CrudFacadeBase } from '../../../../../shared/crud';
import type { CudMessages } from '../../../../../shared/crud';
import type { VendorPayment, VendorPaymentPayload } from './vendor-payment.model';
import { VendorPaymentStore } from './vendor-payment.store';

@Injectable({ providedIn: 'root' })
export class VendorPaymentFacade extends CrudFacadeBase<VendorPayment, VendorPaymentPayload> {
  private readonly store = inject(VendorPaymentStore);

  protected readonly messages: CudMessages = {
    created: 'Vendor payment created.',
    updated: 'Vendor payment updated.',
    deleted: 'Vendor payment deleted.',
  };

  protected doCreate(payload: VendorPaymentPayload): Promise<VendorPayment | null> {
    return this.store.createVendorPayment(payload);
  }

  protected doUpdate(id: string, payload: VendorPaymentPayload): Promise<boolean> {
    return this.store.updateVendorPayment(id, payload);
  }

  protected doDelete(id: string): Promise<boolean> {
    return this.store.deleteVendorPayment(id);
  }
}
