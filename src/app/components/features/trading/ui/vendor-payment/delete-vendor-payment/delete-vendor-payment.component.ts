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
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { VendorPaymentFacade, VendorPaymentStore } from '../../../data/vendor-payment';

@Component({
  selector: 'app-delete-vendor-payment',
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
  templateUrl: './delete-vendor-payment.component.html',
  styleUrl: './delete-vendor-payment.component.css',
})
export class DeleteVendorPaymentComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(VendorPaymentFacade);
  private readonly dateManagement = inject(DateManagementService);
  protected readonly vendorPaymentStore = inject(VendorPaymentStore);
  protected readonly confirmed = signal(false);

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    this.vendorPaymentStore.clearError();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.vendorPaymentStore.loadVendorPaymentById(id, {
        includes: ['vendor', 'bcash'],
      });
    }
  }

  protected formatDate(value: string | undefined): string {
    return this.dateManagement.formatDisplayDate(value, '—');
  }

  protected formatAmount(value: number | undefined): string {
    if (value === undefined || value === null) return '—';
    return value.toFixed(2);
  }

  protected async deletePayment(): Promise<void> {
    const id = this.vendorPaymentStore.selectedItem()?.id;
    if (!id || !this.confirmed()) return;

    await this.facade.delete(id);
  }
}
