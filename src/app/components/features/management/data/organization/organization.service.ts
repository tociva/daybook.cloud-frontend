import { Injectable, inject } from '@angular/core';
import { CrudApiService } from '../../../../../shared/crud';
import type { Organization, OrganizationListQuery, OrganizationPayload } from './organization.model';

const ORG_ENDPOINT = '/organization/organization';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private readonly crudApi = inject(CrudApiService);

  async create(payload: OrganizationPayload): Promise<Organization> {
    return this.crudApi.create<Organization, OrganizationPayload>(ORG_ENDPOINT, payload);
  }

  async delete(id: string): Promise<void> {
    return this.crudApi.delete(ORG_ENDPOINT, id);
  }

  async getById(id: string): Promise<Organization> {
    return this.crudApi.getById<Organization>(ORG_ENDPOINT, id);
  }

  async list(query: OrganizationListQuery = {}): Promise<readonly Organization[]> {
    return this.crudApi.list<Organization>(ORG_ENDPOINT, query);
  }

  async count(query: OrganizationListQuery = {}): Promise<number> {
    return this.crudApi.count(ORG_ENDPOINT, query);
  }

  async update(id: string, payload: OrganizationPayload): Promise<Organization> {
    return this.crudApi.update<Organization, OrganizationPayload>(ORG_ENDPOINT, id, payload);
  }
}
