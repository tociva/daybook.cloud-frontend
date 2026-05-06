import { Injectable, inject } from '@angular/core';
import { CrudFacadeBase } from '../../../../../shared/crud';
import type { CudMessages } from '../../../../../shared/crud';
import type { Organization, OrganizationPayload } from './organization.model';
import { OrganizationStore } from './organization.store';

@Injectable({ providedIn: 'root' })
export class OrganizationFacade extends CrudFacadeBase<Organization, OrganizationPayload> {
  private readonly store = inject(OrganizationStore);

  protected readonly messages: CudMessages = {
    created: 'Organization created.',
    updated: 'Organization updated.',
    deleted: 'Organization deleted.',
  };

  protected doCreate(payload: OrganizationPayload): Promise<Organization | null> {
    return this.store.createOrganization(payload);
  }

  protected doUpdate(id: string, payload: OrganizationPayload): Promise<boolean> {
    return this.store.updateOrganization(id, payload);
  }

  protected doDelete(id: string): Promise<boolean> {
    return this.store.deleteOrganization(id);
  }
}
