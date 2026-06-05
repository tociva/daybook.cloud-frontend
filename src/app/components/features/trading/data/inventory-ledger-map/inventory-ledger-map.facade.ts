import { Injectable, inject } from '@angular/core';
import { CrudFacadeBase, type CudMessages } from '../../../../../shared/crud';
import type { InventoryLedgerMap, InventoryLedgerMapPayload } from './inventory-ledger-map.model';
import { InventoryLedgerMapStore } from './inventory-ledger-map.store';

@Injectable({ providedIn: 'root' })
export class InventoryLedgerMapFacade extends CrudFacadeBase<
  InventoryLedgerMap,
  InventoryLedgerMapPayload
> {
  private readonly store = inject(InventoryLedgerMapStore);

  protected readonly messages: CudMessages = {
    created: 'Inventory ledger mapping created.',
    updated: 'Inventory ledger mapping updated.',
    deleted: 'Inventory ledger mapping deleted.',
  };

  protected doCreate(payload: InventoryLedgerMapPayload): Promise<InventoryLedgerMap | null> {
    return this.store.createInventoryLedgerMap(payload);
  }

  protected doUpdate(id: string, payload: InventoryLedgerMapPayload): Promise<boolean> {
    return this.store.updateInventoryLedgerMap(id, payload);
  }

  protected doDelete(id: string): Promise<boolean> {
    return this.store.deleteInventoryLedgerMap(id);
  }
}

