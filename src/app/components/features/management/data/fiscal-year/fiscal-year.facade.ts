import { Injectable, inject } from '@angular/core';
import { CrudFacadeBase } from '../../../../../shared/crud';
import type { CudMessages } from '../../../../../shared/crud';
import type { FiscalYear, FiscalYearPayload } from './fiscal-year.model';
import { FiscalYearStore } from './fiscal-year.store';

@Injectable({ providedIn: 'root' })
export class FiscalYearFacade extends CrudFacadeBase<FiscalYear, FiscalYearPayload> {
  private readonly store = inject(FiscalYearStore);

  protected readonly messages: CudMessages = {
    created: 'Fiscal year created.',
    updated: 'Fiscal year updated.',
    deleted: 'Fiscal year deleted.',
  };

  protected doCreate(payload: FiscalYearPayload): Promise<FiscalYear | null> {
    return this.store.createFiscalYear(payload);
  }

  protected doUpdate(id: string, payload: FiscalYearPayload): Promise<boolean> {
    return this.store.updateFiscalYear(id, payload);
  }

  protected doDelete(id: string): Promise<boolean> {
    return this.store.deleteFiscalYear(id);
  }
}
