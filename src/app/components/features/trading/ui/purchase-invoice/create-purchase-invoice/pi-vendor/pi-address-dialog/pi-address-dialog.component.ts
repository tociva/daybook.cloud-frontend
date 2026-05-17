import { Component, inject, input, output } from '@angular/core';
import {
  TngButtonComponent,
  TngDialogComponent,
  TngInputComponent,
} from '@tailng-ui/components';
import { PurchaseInvoiceDraftStore } from '../../purchase-invoice-draft.store';

@Component({
  selector: 'app-pi-address-dialog',
  standalone: true,
  imports: [TngDialogComponent, TngInputComponent, TngButtonComponent],
  templateUrl: './pi-address-dialog.component.html',
  styleUrl: './pi-address-dialog.component.css',
})
export class PiAddressDialogComponent {
  protected readonly draft = inject(PurchaseInvoiceDraftStore);

  readonly open = input.required<boolean>();
  readonly closed = output<void>();

  protected onDialogClose(): void {
    this.closed.emit();
  }
}
