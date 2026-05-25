import { Component, input } from '@angular/core';
import { TngTable, TngTableCellTpl } from '@tailng-ui/components';
import type { TngTableColumn } from '@tailng-ui/components';
import type { ParsedFilePreview, ParsedInvoice } from '../gst-reconciliation.types';

@Component({
  selector: 'app-gst-invoice-preview-table',
  standalone: true,
  imports: [TngTable, TngTableCellTpl],
  templateUrl: './gst-invoice-preview-table.component.html',
  styleUrl: './gst-invoice-preview-table.component.css',
})
export class GstInvoicePreviewTableComponent {
  readonly preview = input.required<ParsedFilePreview>();
  readonly columns = input.required<readonly TngTableColumn<ParsedInvoice>[]>();

  protected formatNum(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
}
