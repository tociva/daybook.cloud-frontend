import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  TngAutocompleteComponent,
  TngCardActionsComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardFooterComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
  TngError,
  TngFormFieldComponent,
  TngLabelComponent,
  TngSelectComponent,
  TngStepperComponent,
} from '@tailng-ui/components';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlCreateButtonComponent } from '../../../../../../shared/burl-create-button/burl-create-button.component';
import { LedgerStore } from '../../../data/ledger';
import {
  InventoryLedgerMapFacade,
  InventoryLedgerMapStore,
} from '../../../data/inventory-ledger-map';
import { InventoryLedgerMapDraftStore } from './inventory-ledger-map-draft.store';

@Component({
  selector: 'app-create-inventory-ledger-map',
  standalone: true,
  providers: [InventoryLedgerMapDraftStore],
  imports: [
    TngAutocompleteComponent,
    TngCardActionsComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardFooterComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    TngError,
    TngFormFieldComponent,
    TngLabelComponent,
    TngSelectComponent,
    TngStepperComponent,
    BurlBackButtonComponent,
    BurlCreateButtonComponent,
  ],
  templateUrl: './create-inventory-ledger-map.component.html',
  styleUrl: './create-inventory-ledger-map.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateInventoryLedgerMapComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(InventoryLedgerMapFacade);
  private readonly ledgerStore = inject(LedgerStore);
  protected readonly inventoryLedgerMapStore = inject(InventoryLedgerMapStore);
  protected readonly draft = inject(InventoryLedgerMapDraftStore);

  protected readonly id = signal<string | null>(null);
  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly title = computed(() =>
    this.mode() === 'edit' ? 'Edit Inventory Ledger Mapping' : 'New Inventory Ledger Mapping',
  );

  constructor() {
    void this.loadInitialState();
  }

  protected async submitForm(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.draft.submitted.set(true);

    if (this.draft.entityError() || this.draft.ledgerError()) return;

    const currentId = this.id();
    const payload = this.draft.buildPayload();

    if (currentId) {
      await this.facade.update(currentId, payload);
    } else {
      await this.facade.create(payload);
    }
  }

  private async loadInitialState(): Promise<void> {
    this.inventoryLedgerMapStore.clearError();

    await Promise.all([
      this.ledgerStore.loadLedgers({ limit: 50, offset: 0 }),
      this.draft.loadEntitiesForType(this.draft.entitytype()),
    ]);

    const id = this.route.snapshot.paramMap.get('id');
    this.id.set(id);

    if (!id) {
      this.inventoryLedgerMapStore.clearSelectedItem();
      return;
    }

    const cached = this.inventoryLedgerMapStore.selectedItem();
    if (cached?.id === id) {
      await this.draft.patchFromMapping(cached);
      return;
    }

    const item = await this.inventoryLedgerMapStore.loadInventoryLedgerMapById(id);
    if (item) {
      await this.draft.patchFromMapping(item);
    }
  }
}
