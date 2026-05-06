import { Component, inject } from '@angular/core';
import {
  TngButtonComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
  TngInputComponent,
  TngSwitchComponent,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { SaleInvoiceDraftStore } from '../sale-invoice-draft.store';

@Component({
  selector: 'app-si-line-items',
  standalone: true,
  imports: [
    TngButtonComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    TngInputComponent,
    TngSwitchComponent,
    TngIcon,
  ],
  templateUrl: './si-line-items.component.html',
  styleUrl: './si-line-items.component.css',
})
export class SiLineItemsComponent {
  protected readonly draft = inject(SaleInvoiceDraftStore);
}
