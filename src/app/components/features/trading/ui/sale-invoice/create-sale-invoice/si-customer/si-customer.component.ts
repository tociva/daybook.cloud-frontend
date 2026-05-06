import { Component, inject } from '@angular/core';
import {
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
  TngInputComponent,
  TngLabelComponent,
  TngSwitchComponent,
} from '@tailng-ui/components';
import { SaleInvoiceDraftStore } from '../sale-invoice-draft.store';

@Component({
  selector: 'app-si-customer',
  standalone: true,
  imports: [
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    TngInputComponent,
    TngLabelComponent,
    TngSwitchComponent,
  ],
  templateUrl: './si-customer.component.html',
  styleUrl: './si-customer.component.css',
})
export class SiCustomerComponent {
  protected readonly draft = inject(SaleInvoiceDraftStore);
}
