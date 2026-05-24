import { Injectable, inject } from '@angular/core';
import { ToastStore } from '../../../../../core/toast/toast.store';
import { BurlNavigationService } from '../../../../../shared/burl-back-button/burl-navigation.service';
import { CrudFacadeBase } from '../../../../../shared/crud';
import type { CudMessages, CudOptions } from '../../../../../shared/crud';
import type { Organization, OrganizationBootstrap, OrganizationPayload } from './organization.model';
import { OrganizationStore } from './organization.store';

@Injectable({ providedIn: 'root' })
export class OrganizationFacade extends CrudFacadeBase<Organization, OrganizationPayload> {
  private readonly store = inject(OrganizationStore);
  private readonly facadeToast = inject(ToastStore);
  private readonly facadeNavigation = inject(BurlNavigationService);

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

  async createWithDefaultBranch(
    payload: OrganizationBootstrap,
    options: CudOptions = {},
  ): Promise<Organization | null> {
    const result = await this.store.createOrganizationWithDefaultBranch(payload);
    if (result) {
      this.facadeToast.success(this.messages.created);
      if (options.navigateBack ?? true) {
        await this.facadeNavigation.navigateBack();
      }
    }

    return result;
  }
}
