import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  TngCardActionsComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardFooterComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
  TngCheckboxComponent,
} from '@tailng-ui/components';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlDeleteButtonComponent } from '../../../../../../shared/burl-delete-button/burl-delete-button.component';
import {
  InventoryLedgerMapFacade,
  InventoryLedgerMapStore,
} from '../../../data/inventory-ledger-map';
import { InventoryLedgerMapDraftStore } from '../create-inventory-ledger-map/inventory-ledger-map-draft.store';

@Component({
  selector: 'app-delete-inventory-ledger-map',
  standalone: true,
  providers: [InventoryLedgerMapDraftStore],
  imports: [
    TngCardActionsComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardFooterComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    TngCheckboxComponent,
    BurlBackButtonComponent,
    BurlDeleteButtonComponent,
  ],
  templateUrl: './delete-inventory-ledger-map.component.html',
  styleUrl: './delete-inventory-ledger-map.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteInventoryLedgerMapComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(InventoryLedgerMapFacade);
  protected readonly inventoryLedgerMapStore = inject(InventoryLedgerMapStore);
  protected readonly draft = inject(InventoryLedgerMapDraftStore);
  protected readonly confirmed = signal(false);

  constructor() {
    void this.loadInitialState();
  }

  protected async deleteInventoryLedgerMap(): Promise<void> {
    const id = this.inventoryLedgerMapStore.selectedItem()?.id;
    if (!id || !this.confirmed()) return;
    await this.facade.delete(id);
  }

  private async loadInitialState(): Promise<void> {
    this.inventoryLedgerMapStore.clearError();

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    const cached = this.inventoryLedgerMapStore.selectedItem();
    const item =
      cached?.id === id ? cached : await this.inventoryLedgerMapStore.loadInventoryLedgerMapById(id);

    if (item) {
      await this.draft.patchFromMapping(item);
    }
  }
}
