import { Injectable, inject } from '@angular/core';
import { CrudApiService } from '../../../../../shared/crud';
import type {
  VendorPayment,
  VendorPaymentGetQuery,
  VendorPaymentListQuery,
  VendorPaymentPayload,
} from './vendor-payment.model';

const VENDOR_PAYMENT_ENDPOINT = '/inventory/vendor-payment';

@Injectable({ providedIn: 'root' })
export class VendorPaymentService {
  private readonly crudApi = inject(CrudApiService);

  async create(payload: VendorPaymentPayload): Promise<VendorPayment> {
    return this.crudApi.create<VendorPayment, VendorPaymentPayload>(
      VENDOR_PAYMENT_ENDPOINT,
      payload,
    );
  }

  async delete(id: string): Promise<void> {
    return this.crudApi.delete(VENDOR_PAYMENT_ENDPOINT, id);
  }

  async getById(id: string, query?: VendorPaymentGetQuery): Promise<VendorPayment> {
    return this.crudApi.getById<VendorPayment>(VENDOR_PAYMENT_ENDPOINT, id, query);
  }

  async list(query: VendorPaymentListQuery = {}): Promise<readonly VendorPayment[]> {
    return this.crudApi.list<VendorPayment>(VENDOR_PAYMENT_ENDPOINT, query);
  }

  async count(query: VendorPaymentListQuery = {}): Promise<number> {
    return this.crudApi.count(VENDOR_PAYMENT_ENDPOINT, query);
  }

  async update(id: string, payload: VendorPaymentPayload): Promise<VendorPayment> {
    return this.crudApi.update<VendorPayment, VendorPaymentPayload>(
      VENDOR_PAYMENT_ENDPOINT,
      id,
      payload,
    );
  }
}
