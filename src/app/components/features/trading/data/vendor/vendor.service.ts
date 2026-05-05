import { Injectable, inject } from '@angular/core';
import { CrudApiService } from '../../../../../shared/crud';
import type {
  Vendor,
  VendorGetQuery,
  VendorListQuery,
  VendorPayload,
} from './vendor.model';

const VENDOR_ENDPOINT = '/inventory/vendor';

@Injectable({ providedIn: 'root' })
export class VendorService {
  private readonly crudApi = inject(CrudApiService);

  async create(payload: VendorPayload): Promise<Vendor> {
    return this.crudApi.create<Vendor, VendorPayload>(VENDOR_ENDPOINT, payload);
  }

  async delete(id: string): Promise<void> {
    return this.crudApi.delete(VENDOR_ENDPOINT, id);
  }

  async getById(id: string, query?: VendorGetQuery): Promise<Vendor> {
    return this.crudApi.getById<Vendor>(VENDOR_ENDPOINT, id, query);
  }

  async list(query: VendorListQuery = {}): Promise<readonly Vendor[]> {
    return this.crudApi.list<Vendor>(VENDOR_ENDPOINT, query);
  }

  async count(query: VendorListQuery = {}): Promise<number> {
    return this.crudApi.count(VENDOR_ENDPOINT, query);
  }

  async update(id: string, payload: VendorPayload): Promise<Vendor> {
    return this.crudApi.update<Vendor, VendorPayload>(VENDOR_ENDPOINT, id, payload);
  }
}
