import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { SaleInvoiceReceiptsPanelComponent } from './sale-invoice-receipts-panel.component';

@Component({
  selector: 'app-sale-invoice-receipts',
  standalone: true,
  imports: [BurlBackButtonComponent, PageHeadingComponent, SaleInvoiceReceiptsPanelComponent],
  templateUrl: './sale-invoice-receipts.component.html',
  styleUrl: './sale-invoice-receipts.component.css',
})
export class SaleInvoiceReceiptsComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly invoiceId = computed(() => this.route.snapshot.paramMap.get('id') ?? '');
}
