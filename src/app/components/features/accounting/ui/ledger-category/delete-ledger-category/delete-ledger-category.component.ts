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
import { LedgerCategoryFacade, LedgerCategoryStore } from '../../../data/ledger-category';

@Component({
  selector: 'app-delete-ledger-category',
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
  templateUrl: './delete-ledger-category.component.html',
  styleUrl: './delete-ledger-category.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteLedgerCategoryComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(LedgerCategoryFacade);
  protected readonly ledgerCategoryStore = inject(LedgerCategoryStore);
  protected readonly confirmed = signal(false);

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    this.ledgerCategoryStore.clearError();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.ledgerCategoryStore.loadLedgerCategoryById(id, { includes: ['parent'] });
    }
  }

  protected async deleteLedgerCategory(): Promise<void> {
    const id = this.ledgerCategoryStore.selectedItem()?.id;
    if (!id || !this.confirmed()) return;

    await this.facade.delete(id);
  }
}
