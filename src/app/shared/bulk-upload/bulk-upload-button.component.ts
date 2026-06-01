import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { TngButtonComponent, TngDialogComponent, TngTable } from '@tailng-ui/components';
import type { TngTableColumn } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import {
  TngFileUploadDirective,
  type TngFileUploadRejectedEvent,
  type TngFileUploadSelectedEvent,
} from '@tailng-ui/primitives';
import { getApiErrorMessage } from '../../core/api/api-error.util';
import { ToastStore } from '../../core/toast/toast.store';
import { BulkUploadService } from './bulk-upload.service';

const DEFAULT_ACCEPT = 'application/json,text/json,application/octet-stream,.json';
const DEFAULT_MAX_SIZE = 1048576;
const ACCEPTED_MIME_TYPES = new Set(['application/json', 'text/json', 'application/octet-stream']);

type BulkUploadPreviewRow = Record<string, unknown>;

type BulkUploadPreview = Readonly<{
  columns: readonly TngTableColumn<BulkUploadPreviewRow>[];
  file: File;
  fileSize: string;
  modelName: string;
  rowCount: number;
  rootKey: string;
  rootKeys: readonly string[];
  rows: readonly BulkUploadPreviewRow[];
  uploadFile: File;
}>;

type BulkUploadPreviewConfig = Readonly<{
  columns: readonly TngTableColumn<BulkUploadPreviewRow>[];
  modelName: string;
  rootKey: string;
}>;

const textColumn = (
  id: string,
  label: string,
  path: string,
  width?: string,
): TngTableColumn<BulkUploadPreviewRow> => ({
  id,
  label,
  accessor: (row) => formatPreviewValue(readPath(row, path)),
  ...(width ? { width } : {}),
});

const numberColumn = (
  id: string,
  label: string,
  path: string,
  width?: string,
): TngTableColumn<BulkUploadPreviewRow> => ({
  id,
  label,
  align: 'end',
  headerAlign: 'end',
  accessor: (row) => formatPreviewValue(readPath(row, path)),
  ...(width ? { width } : {}),
});

const countColumn = (
  id: string,
  label: string,
  path: string,
  width?: string,
): TngTableColumn<BulkUploadPreviewRow> => ({
  id,
  label,
  align: 'end',
  headerAlign: 'end',
  accessor: (row) => {
    const value = readPath(row, path);
    return Array.isArray(value) ? value.length : 0;
  },
  ...(width ? { width } : {}),
});

const namesColumn = (
  id: string,
  label: string,
  path: string,
  width?: string,
): TngTableColumn<BulkUploadPreviewRow> => ({
  id,
  label,
  accessor: (row) => formatPreviewValue(readPath(row, path)),
  truncate: true,
  ...(width ? { width } : {}),
});

const BULK_UPLOAD_PREVIEW_CONFIGS: Record<string, BulkUploadPreviewConfig> = {
  '/inventory/item/bulk-upload': {
    modelName: 'Items',
    rootKey: 'items',
    columns: [
      textColumn('name', 'Name', 'name', '12rem'),
      textColumn('code', 'Code', 'code', '8rem'),
      textColumn('displayname', 'Display name', 'displayname', '12rem'),
      textColumn('category', 'Category', 'category', '12rem'),
      textColumn('barcode', 'Barcode', 'barcode', '10rem'),
      namesColumn('description', 'Description', 'description'),
    ],
  },
  '/inventory/item-category/bulk-upload': {
    modelName: 'Item Categories',
    rootKey: 'itemCategory',
    columns: [
      textColumn('name', 'Name', 'name', '12rem'),
      textColumn('code', 'Code', 'code', '8rem'),
      textColumn('type', 'Type', 'type', '8rem'),
      textColumn('parent', 'Parent', 'parent', '12rem'),
      textColumn('taxgroup', 'Tax group', 'taxgroup', '12rem'),
      namesColumn('description', 'Description', 'description'),
    ],
  },
  '/inventory/tax/bulk-upload': {
    modelName: 'Taxes',
    rootKey: 'taxes',
    columns: [
      textColumn('name', 'Name', 'name', '14rem'),
      textColumn('shortname', 'Short name', 'shortname', '9rem'),
      numberColumn('rate', 'Rate', 'rate', '7rem'),
      numberColumn('appliedto', 'Applied to', 'appliedto', '8rem'),
      namesColumn('description', 'Description', 'description'),
    ],
  },
  '/inventory/tax-group/bulk-upload': {
    modelName: 'Tax Groups',
    rootKey: 'taxgroups',
    columns: [
      textColumn('name', 'Name', 'name', '14rem'),
      numberColumn('rate', 'Rate', 'rate', '7rem'),
      countColumn('groups', 'Groups', 'groups', '7rem'),
      namesColumn('description', 'Description', 'description'),
    ],
  },
  '/inventory/customer/bulk-upload': {
    modelName: 'Customers',
    rootKey: 'customers',
    columns: [
      textColumn('name', 'Name', 'name', '14rem'),
      textColumn('mobile', 'Mobile', 'mobile', '10rem'),
      textColumn('email', 'Email', 'email', '14rem'),
      textColumn('gstin', 'GSTIN', 'gstin', '12rem'),
      textColumn('city', 'City', 'address.city', '10rem'),
      textColumn('state', 'State', 'state', '10rem'),
      textColumn('currencycode', 'Currency', 'currencycode', '8rem'),
    ],
  },
  '/inventory/vendor/bulk-upload': {
    modelName: 'Vendors',
    rootKey: 'vendors',
    columns: [
      textColumn('name', 'Name', 'name', '14rem'),
      textColumn('mobile', 'Mobile', 'mobile', '10rem'),
      textColumn('email', 'Email', 'email', '14rem'),
      textColumn('gstin', 'GSTIN', 'gstin', '12rem'),
      textColumn('pan', 'PAN', 'pan', '9rem'),
      textColumn('city', 'City', 'address.city', '10rem'),
      textColumn('currencycode', 'Currency', 'currencycode', '8rem'),
    ],
  },
  '/inventory/bank-cash/bulk-upload': {
    modelName: 'Bank/Cash Accounts',
    rootKey: 'bankCash',
    columns: [
      textColumn('name', 'Name', 'name', '16rem'),
      namesColumn('description', 'Description', 'description'),
    ],
  },
  '/inventory/purchase-invoice/bulk-upload': {
    modelName: 'Purchase Invoices',
    rootKey: 'invoices',
    columns: [
      textColumn('number', 'Number', 'number', '10rem'),
      textColumn('date', 'Date', 'date', '9rem'),
      textColumn('vendorname', 'Vendor', 'vendorname', '14rem'),
      textColumn('currencycode', 'Currency', 'currencycode', '8rem'),
      countColumn('items', 'Items', 'items', '7rem'),
      numberColumn('subtotal', 'Subtotal', 'subtotal', '9rem'),
      numberColumn('grandtotal', 'Grand total', 'grandtotal', '10rem'),
    ],
  },
  '/inventory/sale-invoice/bulk-upload': {
    modelName: 'Sale Invoices',
    rootKey: 'invoices',
    columns: [
      textColumn('number', 'Number', 'number', '10rem'),
      textColumn('date', 'Date', 'date', '9rem'),
      textColumn('customername', 'Customer', 'customername', '14rem'),
      textColumn('currencycode', 'Currency', 'currencycode', '8rem'),
      countColumn('items', 'Items', 'items', '7rem'),
      numberColumn('subtotal', 'Subtotal', 'subtotal', '9rem'),
      numberColumn('grandtotal', 'Grand total', 'grandtotal', '10rem'),
    ],
  },
  '/inventory/customer-receipt/bulk-upload': {
    modelName: 'Customer Receipts',
    rootKey: 'receipts',
    columns: [
      textColumn('number', 'Number', 'number', '10rem'),
      textColumn('date', 'Date', 'date', '9rem'),
      textColumn('customername', 'Customer', 'customername', '14rem'),
      textColumn('bcashname', 'Bank/Cash', 'bcashname', '12rem'),
      textColumn('currencycode', 'Currency', 'currencycode', '8rem'),
      numberColumn('amount', 'Amount', 'amount', '10rem'),
      countColumn('invoices', 'Invoices', 'invoices', '8rem'),
    ],
  },
  '/inventory/vendor-payment/bulk-upload': {
    modelName: 'Vendor Payments',
    rootKey: 'payments',
    columns: [
      textColumn('date', 'Date', 'date', '9rem'),
      textColumn('vendorname', 'Vendor', 'vendorname', '14rem'),
      textColumn('bcashname', 'Bank/Cash', 'bcashname', '12rem'),
      textColumn('currencycode', 'Currency', 'currencycode', '8rem'),
      numberColumn('amount', 'Amount', 'amount', '10rem'),
      countColumn('invoices', 'Invoices', 'invoices', '8rem'),
      namesColumn('description', 'Description', 'description'),
    ],
  },
  '/accounting/ledger-category/bulk-upload': {
    modelName: 'Ledger Categories',
    rootKey: 'ledgerCategory',
    columns: [
      textColumn('name', 'Name', 'name', '14rem'),
      textColumn('type', 'Type', 'type', '10rem'),
      textColumn('parent', 'Parent', 'parent', '14rem'),
      namesColumn('description', 'Description', 'description'),
    ],
  },
  '/accounting/ledger/bulk-upload': {
    modelName: 'Ledgers',
    rootKey: 'ledgers',
    columns: [
      textColumn('name', 'Name', 'name', '14rem'),
      textColumn('category', 'Category', 'category', '14rem'),
      numberColumn('openingdr', 'Opening DR', 'openingdr', '10rem'),
      numberColumn('openingcr', 'Opening CR', 'openingcr', '10rem'),
      namesColumn('description', 'Description', 'description'),
    ],
  },
  '/accounting/bank-txn/bulk-upload': {
    modelName: 'Bank Transactions',
    rootKey: 'bankTxns',
    columns: [
      textColumn('bankname', 'Bank/Cash', 'bankname', '14rem'),
      textColumn('txndate', 'Date', 'txndate', '9rem'),
      numberColumn('debit', 'Debit', 'debit', '9rem'),
      numberColumn('credit', 'Credit', 'credit', '9rem'),
      textColumn('bankref', 'Bank ref', 'bankref', '12rem'),
      namesColumn('description', 'Description', 'description'),
    ],
  },
  '/accounting/journal/bulk-upload': {
    modelName: 'Journals',
    rootKey: 'journals',
    columns: [
      textColumn('number', 'Number', 'number', '10rem'),
      textColumn('date', 'Date', 'date', '9rem'),
      countColumn('entries', 'Entries', 'entries', '8rem'),
      {
        id: 'totaldebit',
        label: 'Total debit',
        align: 'end',
        headerAlign: 'end',
        width: '10rem',
        accessor: (row) => totalEntryAmount(row, 'debit'),
      },
      {
        id: 'totalcredit',
        label: 'Total credit',
        align: 'end',
        headerAlign: 'end',
        width: '10rem',
        accessor: (row) => totalEntryAmount(row, 'credit'),
      },
      namesColumn('description', 'Description', 'description'),
    ],
  },
};

function normalizeEndpointPath(endpointPath: string): string {
  let pathname = endpointPath.trim();

  try {
    pathname = new URL(pathname).pathname;
  } catch {
    // Plain endpoint paths are expected here.
  }

  return `/${pathname.replace(/^\/+/, '').replace(/\/+$/, '')}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readPath(row: BulkUploadPreviewRow, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (!isRecord(current)) return undefined;
    return current[key];
  }, row);
}

function formatPreviewValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) {
    return value.map((entry) => formatPreviewValue(formatArrayEntry(entry))).join(', ');
  }
  if (isRecord(value)) return JSON.stringify(value);

  return String(value);
}

function formatArrayEntry(value: unknown): unknown {
  if (!isRecord(value)) return value;

  for (const key of ['name', 'number', 'ledger', 'saleinvoicenumber', 'purchaseinvoicenumber']) {
    const nestedValue = value[key];
    if (nestedValue !== null && nestedValue !== undefined && nestedValue !== '') {
      return nestedValue;
    }
  }

  return value;
}

function totalEntryAmount(row: BulkUploadPreviewRow, amountKey: 'credit' | 'debit'): string {
  const entries = readPath(row, 'entries');
  if (!Array.isArray(entries)) return '';

  const total = entries.reduce((sum, entry) => {
    if (!isRecord(entry)) return sum;

    const value = entry[amountKey];
    return typeof value === 'number' && Number.isFinite(value) ? sum + value : sum;
  }, 0);

  return formatPreviewValue(total);
}

@Component({
  selector: 'app-bulk-upload-button',
  imports: [TngButtonComponent, TngDialogComponent, TngIcon, TngFileUploadDirective, TngTable],
  templateUrl: './bulk-upload-button.component.html',
  styleUrl: './bulk-upload-button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BulkUploadButtonComponent {
  private readonly bulkUploadService = inject(BulkUploadService);
  private readonly toastStore = inject(ToastStore);

  readonly accept = input(DEFAULT_ACCEPT);
  readonly disabled = input(false);
  readonly endpoint = input.required<string>();
  readonly label = input('Bulk upload');
  readonly maxSize = input(DEFAULT_MAX_SIZE);
  readonly uploaded = output<readonly unknown[]>();

  protected readonly isUploading = signal(false);
  protected readonly isPreviewOpen = signal(false);
  protected readonly pendingUpload = signal<BulkUploadPreview | null>(null);
  protected readonly isDisabled = computed(() => this.disabled() || this.isUploading());

  protected chooseFile(input: HTMLInputElement): void {
    if (this.isDisabled()) return;
    input.click();
  }

  protected async onFileInputChange(event: Event): Promise<void> {
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.[0] ?? null;
    inputElement.value = '';
    if (!file) return;

    await this.uploadFile(file);
  }

  protected async onFilesSelected(event: TngFileUploadSelectedEvent): Promise<void> {
    const file = event.files[0];
    if (!file) return;

    await this.uploadFile(file);
  }

  protected async onFilesRejected(event: TngFileUploadRejectedEvent): Promise<void> {
    const first = event.rejected[0];
    this.toastStore.warning(first?.message ?? 'Select one valid JSON file to upload.');

    const file = event.accepted[0];
    if (file) {
      await this.uploadFile(file);
    }
  }

  private async uploadFile(file: File): Promise<void> {
    if (this.isDisabled()) return;

    const fileError = this.validateFile(file);
    if (fileError) {
      this.toastStore.warning(fileError);
      return;
    }

    const preview = await this.preparePreview(file);
    if (typeof preview === 'string') {
      this.toastStore.warning(preview);
      return;
    }

    this.pendingUpload.set(preview);
    this.isPreviewOpen.set(true);
  }

  protected cancelPreview(): void {
    if (this.isUploading()) return;

    this.clearPreview();
  }

  protected onPreviewClosed(): void {
    if (!this.isUploading()) {
      this.clearPreview();
    }
  }

  protected async confirmUpload(): Promise<void> {
    const pending = this.pendingUpload();
    if (!pending || this.isUploading()) return;

    this.isUploading.set(true);
    try {
      const created = await this.bulkUploadService.upload(this.endpoint(), pending.uploadFile);
      this.toastStore.success(this.successMessage(created));
      this.uploaded.emit(created);
      this.clearPreview();
    } catch (error) {
      this.toastStore.danger(getApiErrorMessage(error, 'Bulk upload failed.'));
    } finally {
      this.isUploading.set(false);
    }
  }

  private validateFile(file: File): string | null {
    if (file.size <= 0) {
      return 'Select a non-empty JSON file.';
    }

    if (file.size > this.maxSize()) {
      return `Select a JSON file smaller than ${this.formatFileSize(this.maxSize())}.`;
    }

    if (!this.isAcceptedFile(file)) {
      return 'Select a JSON file.';
    }

    return null;
  }

  private async preparePreview(file: File): Promise<BulkUploadPreview | string> {
    const config = this.previewConfig();
    if (!config) {
      return 'Bulk upload preview is not configured for this model.';
    }

    let content: string;
    try {
      content = await file.text();
    } catch {
      return 'Unable to read the selected file.';
    }

    try {
      const parsed = JSON.parse(content) as unknown;
      if (!isRecord(parsed)) {
        return 'Bulk upload JSON root must be an object.';
      }

      const rows = parsed[config.rootKey];
      if (!Array.isArray(rows)) {
        return `Bulk upload JSON must contain a "${config.rootKey}" array.`;
      }

      if (!rows.length) {
        return `The "${config.rootKey}" array must contain at least one record.`;
      }

      if (!rows.every(isRecord)) {
        return `Every item in "${config.rootKey}" must be an object.`;
      }

      return {
        columns: config.columns,
        file,
        fileSize: this.formatFileSize(file.size),
        modelName: config.modelName,
        rowCount: rows.length,
        rootKey: config.rootKey,
        rootKeys: Object.keys(parsed),
        rows,
        uploadFile: this.toUploadFile(file),
      };
    } catch {
      return 'File must contain valid JSON.';
    }
  }

  private previewConfig(): BulkUploadPreviewConfig | null {
    return BULK_UPLOAD_PREVIEW_CONFIGS[normalizeEndpointPath(this.endpoint())] ?? null;
  }

  private isAcceptedFile(file: File): boolean {
    if (ACCEPTED_MIME_TYPES.has(file.type)) {
      return true;
    }

    return file.name.toLowerCase().endsWith('.json');
  }

  private toUploadFile(file: File): File {
    if (ACCEPTED_MIME_TYPES.has(file.type)) {
      return file;
    }

    return new File([file], file.name, {
      lastModified: file.lastModified,
      type: 'application/json',
    });
  }

  private clearPreview(): void {
    this.isPreviewOpen.set(false);
    this.pendingUpload.set(null);
  }

  private successMessage(created: readonly unknown[]): string {
    const count = Array.isArray(created) ? created.length : 0;
    return count > 0
      ? `Bulk upload completed. ${count} record${count === 1 ? '' : 's'} created.`
      : 'Bulk upload completed.';
  }

  private formatFileSize(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'] as const;
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }

    return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${
      units[unitIndex]
    }`;
  }
}
