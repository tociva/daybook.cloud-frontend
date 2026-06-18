import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { PurchaseInvoicePaymentsPanelComponent } from './purchase-invoice-payments-panel.component';

@Component({
  selector: 'app-purchase-invoice-payments',
  standalone: true,
  imports: [BurlBackButtonComponent, PageHeadingComponent, PurchaseInvoicePaymentsPanelComponent],
  templateUrl: './purchase-invoice-payments.component.html',
  styleUrl: './purchase-invoice-payments.component.css',
})
export class PurchaseInvoicePaymentsComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly invoiceId = computed(() => this.route.snapshot.paramMap.get('id') ?? '');
}
