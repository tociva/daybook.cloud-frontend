import { Component, inject, signal } from '@angular/core';
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
import { PurchaseReturnFacade, PurchaseReturnStore } from '../../../data/purchase-return';
import { DateManagementService } from '../../../../../../core/date/date-management.service';

@Component({
  selector: 'app-delete-purchase-return',
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
  templateUrl: './delete-purchase-return.component.html',
  styleUrl: './delete-purchase-return.component.css',
})
export class DeletePurchaseReturnComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(PurchaseReturnFacade);
  private readonly dateManagement = inject(DateManagementService);
  protected readonly purchaseReturnStore = inject(PurchaseReturnStore);
  protected readonly confirmed = signal(false);

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    if (this.purchaseReturnStore.selectedItem()?.id === id) return;

    await this.purchaseReturnStore.loadPurchaseReturnById(id, {
      includes: [{ relation: 'purchaseinvoice', scope: { include: ['vendor'] } }],
    });
  }

  protected formatDate(value: string | undefined): string {
    return this.dateManagement.formatDisplayDate(value, '—');
  }

  protected formatAmount(value: number | undefined): string {
    if (value === undefined || value === null) return '—';
    return value.toFixed(2);
  }

  protected async deleteReturn(): Promise<void> {
    const id = this.purchaseReturnStore.selectedItem()?.id;
    if (!id || !this.confirmed()) return;

    await this.facade.delete(id);
  }
}
