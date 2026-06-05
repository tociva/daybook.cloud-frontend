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
import {
  formatInventoryLedgerEntityType,
  formatInventoryLedgerType,
} from '../inventory-ledger-map.labels';

@Component({
  selector: 'app-delete-inventory-ledger-map',
  standalone: true,
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
  protected readonly confirmed = signal(false);

  constructor() {
    void this.loadInitialState();
  }

  protected formatEntityType(value: string): string {
    return formatInventoryLedgerEntityType(value);
  }

  protected formatLedgerType(value: string | null | undefined): string {
    return formatInventoryLedgerType(value);
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
    if (this.inventoryLedgerMapStore.selectedItem()?.id === id) return;
    await this.inventoryLedgerMapStore.loadInventoryLedgerMapById(id);
  }
}
