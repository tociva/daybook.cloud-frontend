import { Component, inject, input, output } from '@angular/core';
import {
  TngButtonComponent,
  TngDialogComponent,
  TngInputComponent,
  TngSwitchComponent,
} from '@tailng-ui/components';
import { SaleInvoiceDraftStore } from '../../sale-invoice-draft.store';

@Component({
  selector: 'app-si-address-dialog',
  standalone: true,
  imports: [TngDialogComponent, TngInputComponent, TngSwitchComponent, TngButtonComponent],
  templateUrl: './si-address-dialog.component.html',
  styleUrl: './si-address-dialog.component.css',
})
export class SiAddressDialogComponent {
  protected readonly draft = inject(SaleInvoiceDraftStore);

  readonly open = input.required<boolean>();
  readonly closed = output<void>();

  protected onDialogClose(): void {
    this.closed.emit();
  }
}
