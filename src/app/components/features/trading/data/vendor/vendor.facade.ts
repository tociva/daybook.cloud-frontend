import { Injectable, inject } from '@angular/core';
import { CrudFacadeBase } from '../../../../../shared/crud';
import type { CudMessages } from '../../../../../shared/crud';
import type { Vendor, VendorPayload } from './vendor.model';
import { VendorStore } from './vendor.store';

@Injectable({ providedIn: 'root' })
export class VendorFacade extends CrudFacadeBase<Vendor, VendorPayload> {
  private readonly store = inject(VendorStore);

  protected readonly messages: CudMessages = {
    created: 'Vendor created.',
    updated: 'Vendor updated.',
    deleted: 'Vendor deleted.',
  };

  protected doCreate(payload: VendorPayload): Promise<Vendor | null> {
    return this.store.createVendor(payload);
  }

  protected doUpdate(id: string, payload: VendorPayload): Promise<boolean> {
    return this.store.updateVendor(id, payload);
  }

  protected doDelete(id: string): Promise<boolean> {
    return this.store.deleteVendor(id);
  }
}
