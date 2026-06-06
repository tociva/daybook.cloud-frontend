import { Component, computed, input, output } from '@angular/core';
import {
  TngButtonComponent,
  TngDialogComponent,
  TngError,
} from '@tailng-ui/components';
import type { TngTableColumn } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import type { GstReconciliationReturnType } from '../../../data/gst-reconciliation/gst-reconciliation.model';
import { GstInvoicePreviewTableComponent } from '../gst-invoice-preview-table/gst-invoice-preview-table.component';
import {
  RETURN_TYPES,
  type ParsedFilePreview,
  type ParsedInvoice,
} from '../gst-reconciliation.types';

@Component({
  selector: 'app-gst-import-confirm-dialog',
  standalone: true,
  imports: [
    TngButtonComponent,
    TngDialogComponent,
    TngError,
    TngIcon,
    GstInvoicePreviewTableComponent,
  ],
  templateUrl: './gst-import-confirm-dialog.component.html',
  styleUrl: './gst-import-confirm-dialog.component.css',
})
export class GstImportConfirmDialogComponent {
  // ── Inputs ────────────────────────────────────────────────────────────────
  readonly open          = input.required<boolean>();
  readonly pendingFile   = input<File | null>(null);
  readonly parsedPreview = input<ParsedFilePreview | null>(null);
  readonly isParsing     = input<boolean>(false);
  readonly pendingError  = input<string | null>(null);
  readonly isImporting   = input<boolean>(false);

  // ── Outputs ───────────────────────────────────────────────────────────────
  readonly confirmed = output<GstReconciliationReturnType>();
  readonly cancelled = output<void>();

  // ── Static data ───────────────────────────────────────────────────────────
  protected readonly returnTypes = RETURN_TYPES;

  protected readonly gstr2bPreviewColumns: readonly TngTableColumn<ParsedInvoice>[] = [
    { id: 'rowNumber',    label: '#',           align: 'end', width: '3rem',  accessor: (_row, index) => index + 1 },
    { id: 'supplierName', label: 'Supplier',    truncate: true, width: '12rem', accessor: (row) => this.formatText(row.supplierName) },
    { id: 'gstin',        label: 'GSTIN',       width: '11rem', accessor: (row) => this.formatText(row.gstin) },
    { id: 'invoiceNo',    label: 'Invoice No',  width: '9rem', accessor: (row) => this.formatText(row.invoiceNo) },
    { id: 'invoiceDate',  label: 'Date',        width: '7rem', accessor: (row) => this.formatText(row.invoiceDate) },
    { id: 'invoiceValue', label: 'Value (₹)',   align: 'end', width: '8rem',  accessor: (row) => this.formatNum(row.invoiceValue) },
    { id: 'taxableValue', label: 'Taxable (₹)', align: 'end', width: '8rem',  accessor: (row) => this.formatNum(row.taxableValue) },
    { id: 'igst',         label: 'IGST',        align: 'end', width: '7rem',  accessor: (row) => this.formatOptionalAmount(row.igst) },
    { id: 'cgst',         label: 'CGST',        align: 'end', width: '7rem',  accessor: (row) => this.formatOptionalAmount(row.cgst) },
    { id: 'sgst',         label: 'SGST',        align: 'end', width: '7rem',  accessor: (row) => this.formatOptionalAmount(row.sgst) },
    { id: 'itcAvailable', label: 'ITC',         width: '5rem' },
  ];

  protected readonly gstr1PreviewColumns: readonly TngTableColumn<ParsedInvoice>[] = [
    { id: 'rowNumber',    label: '#',           align: 'end', width: '3rem',  accessor: (_row, index) => index + 1 },
    { id: 'exportType',   label: 'Type',        width: '10rem', accessor: (row) => this.formatText(row.exportType) },
    { id: 'invoiceNo',    label: 'Invoice No',  width: '9rem', accessor: (row) => this.formatText(row.invoiceNo) },
    { id: 'invoiceDate',  label: 'Date',        width: '7rem', accessor: (row) => this.formatText(row.invoiceDate) },
    { id: 'taxRate',      label: 'Rate %',      align: 'end', width: '6rem',  accessor: (row) => row.taxRate ?? '' },
    { id: 'invoiceValue', label: 'Value (₹)',   align: 'end', width: '8rem',  accessor: (row) => this.formatNum(row.invoiceValue) },
    { id: 'taxableValue', label: 'Taxable (₹)', align: 'end', width: '8rem',  accessor: (row) => this.formatNum(row.taxableValue) },
    { id: 'igst',         label: 'IGST',        align: 'end', width: '7rem',  accessor: (row) => this.formatOptionalAmount(row.igst) },
    { id: 'cgst',         label: 'CGST',        align: 'end', width: '7rem',  accessor: (row) => this.formatOptionalAmount(row.cgst) },
    { id: 'sgst',         label: 'SGST',        align: 'end', width: '7rem',  accessor: (row) => this.formatOptionalAmount(row.sgst) },
  ];

  // ── Computed ──────────────────────────────────────────────────────────────
  protected readonly dialogTitle = computed(() => {
    const rt = this.parsedPreview()?.detectedReturnType;
    if (rt === 'gstr1')  return 'Review & Confirm — GSTR-1';
    if (rt === 'gstr2b') return 'Review & Confirm — GSTR-2B';
    return 'Review & Confirm Import';
  });

  // ── Template helpers ──────────────────────────────────────────────────────
  protected previewColumns(preview: ParsedFilePreview): readonly TngTableColumn<ParsedInvoice>[] {
    return preview.detectedReturnType === 'gstr1'
      ? this.gstr1PreviewColumns
      : this.gstr2bPreviewColumns;
  }

  protected returnTypeLabel(rt: GstReconciliationReturnType): string {
    return this.returnTypes.find((t) => t.value === rt)?.label ?? rt;
  }

  protected totalTax(p: ParsedFilePreview): number {
    return p.totalIgst + p.totalCgst + p.totalSgst;
  }

  protected formatFileSize(bytes: number): string {
    if (bytes < 1024)        return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  protected formatNum(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  protected formatOptionalAmount(value: number): string {
    return value ? this.formatNum(value) : '';
  }

  private formatText(value: string | null | undefined): string {
    return value?.trim() ?? '';
  }
}
