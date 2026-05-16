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
import { LedgerFacade, LedgerStore } from '../../../data/ledger';

@Component({
  selector: 'app-delete-ledger',
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
  templateUrl: './delete-ledger.component.html',
  styleUrl: './delete-ledger.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteLedgerComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(LedgerFacade);
  protected readonly ledgerStore = inject(LedgerStore);
  protected readonly confirmed = signal(false);

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    if (this.ledgerStore.selectedItem()?.id === id) return;
    await this.ledgerStore.loadLedgerById(id, { includes: ['category'] });
  }

  protected async deleteLedger(): Promise<void> {
    const id = this.ledgerStore.selectedItem()?.id;
    if (!id || !this.confirmed()) return;

    await this.facade.delete(id);
  }
}
