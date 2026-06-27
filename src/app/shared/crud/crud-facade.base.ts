import { inject } from '@angular/core';
import { BurlNavigationService } from '../burl-back-button/burl-navigation.service';
import { ToastStore } from '../../core/toast/toast.store';

export type CudMessages = Readonly<{
  created: string;
  updated: string;
  deleted: string;
}>;

export type CudOptions = Readonly<{ navigateBack?: boolean }>;

const DEFAULTS: Required<CudOptions> = { navigateBack: true };

export abstract class CrudFacadeBase<TEntity, TCreatePayload, TUpdatePayload = TCreatePayload> {
  private readonly toast = inject(ToastStore);
  private readonly navigation = inject(BurlNavigationService);

  protected abstract readonly messages: CudMessages;
  protected abstract doCreate(payload: TCreatePayload): Promise<TEntity | null>;
  protected abstract doUpdate(id: string, payload: TUpdatePayload): Promise<boolean>;
  protected abstract doDelete(id: string): Promise<boolean>;

  async create(payload: TCreatePayload, options: CudOptions = {}): Promise<TEntity | null> {
    const { navigateBack } = { ...DEFAULTS, ...options };
    const result = await this.doCreate(payload);
    if (result) {
      this.toast.success(this.messages.created);
      if (navigateBack) await this.navigation.navigateBack();
    }
    return result;
  }

  async update(id: string, payload: TUpdatePayload, options: CudOptions = {}): Promise<boolean> {
    const { navigateBack } = { ...DEFAULTS, ...options };
    const result = await this.doUpdate(id, payload);
    if (result) {
      this.toast.success(this.messages.updated);
      if (navigateBack) await this.navigation.navigateBack();
    }
    return result;
  }

  async delete(id: string, options: CudOptions = {}): Promise<boolean> {
    const { navigateBack } = { ...DEFAULTS, ...options };
    const result = await this.doDelete(id);
    if (result) {
      this.toast.success(this.messages.deleted);
      if (navigateBack) await this.navigation.navigateBack();
    }
    return result;
  }
}
