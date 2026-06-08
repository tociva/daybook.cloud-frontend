import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { TngButtonComponent } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import {
  TngFileUploadDirective,
  type TngFileUploadRejectedEvent,
  type TngFileUploadSelectedEvent,
} from '@tailng-ui/primitives';
import { getApiErrorMessage } from '../../../../../../core/api/api-error.util';
import { ToastStore } from '../../../../../../core/toast/toast.store';
import {
  buildColumnOptions,
  findHeaderRowIndex,
  resolveStatementHeaderRowIndex,
  resolveStatementMappingHeaderRowIndex,
  suggestStatementFieldMappings,
  formatStatementCell,
  isImportableStatementRow,
  parseMappedStatementAmount,
  parseStatementDate,
  readFirstSheetRows,
  valueIsEmpty,
} from '../../../../../../shared/bank-statement-xlsx';
import type { StatementFiscalDateRange, StatementRow } from '../../../../../../shared/bank-statement-xlsx';
import { FiscalYearDateRangeService } from '../../../../../../shared/fiscal-year-date-range-picker';
import { BulkUploadService } from '../../../../../../shared/bulk-upload';
import { BankCashStore } from '../../../../trading/data/bank-cash';
import { InventoryLedgerMapStore } from '../../../data/inventory-ledger-map';
import { BankStatementMappingDialogComponent } from '../bank-statement-mapping-dialog/bank-statement-mapping-dialog.component';
import { BankStatementPreviewDialogComponent } from '../bank-statement-preview-dialog/bank-statement-preview-dialog.component';
import {
  BANK_STATEMENT_ACCEPT,
  BANK_STATEMENT_MAX_SIZE,
  BANK_STATEMENT_UPLOAD_ENDPOINT,
  STATEMENT_FIELDS,
  createEmptyFieldMappings,
  type BankStatementFieldPath,
  type BankStatementPreviewRow,
  type PendingStatement,
} from './bank-statement-upload.model';

@Component({
  selector: 'app-bank-statement-upload',
  standalone: true,
  imports: [
    BankStatementMappingDialogComponent,
    BankStatementPreviewDialogComponent,
    TngButtonComponent,
    TngFileUploadDirective,
    TngIcon,
  ],
  templateUrl: './bank-statement-upload.component.html',
  styleUrl: './bank-statement-upload.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BankStatementUploadComponent {
  private static readonly STARTING_ROW_SEARCH_WINDOW = 15;

  private readonly bulkUploadService = inject(BulkUploadService);
  private readonly toastStore = inject(ToastStore);
  private readonly bankCashStore = inject(BankCashStore);
  private readonly inventoryLedgerMapStore = inject(InventoryLedgerMapStore);
  private readonly fiscalYearDateRange = inject(FiscalYearDateRangeService);

  readonly uploaded = output<readonly unknown[]>();

  protected readonly accept = BANK_STATEMENT_ACCEPT;
  protected readonly maxSize = BANK_STATEMENT_MAX_SIZE;
  protected readonly isUploading = signal(false);
  protected readonly isMappingOpen = signal(false);
  protected readonly isPreviewOpen = signal(false);
  protected readonly pendingStatement = signal<PendingStatement | null>(null);
  protected readonly previewRows = signal<readonly BankStatementPreviewRow[]>([]);
  protected readonly selectedBankCashId = signal('');
  protected readonly bankCashQuery = signal('');
  protected readonly startingRow = signal(1);
  protected readonly fieldMappings = signal(createEmptyFieldMappings());

  protected readonly selectedBankCash = computed(
    () => this.bankCashStore.items().find((item) => item.id === this.selectedBankCashId()) ?? null,
  );

  protected readonly selectedInventoryLedgerMapId = computed(() => {
    const bankCashId = this.selectedBankCashId();
    if (!bankCashId) return '';

    return (
      this.inventoryLedgerMapStore
        .items()
        .find((map) => map.entitytype === 'bankCash' && map.entityid === bankCashId && map.id)?.id ??
      ''
    );
  });

  protected readonly mappingError = computed(() => {
    const statement = this.pendingStatement();
    if (!statement) return null;

    if (!this.selectedBankCash()) return 'Bank account is required.';

    const startRow = this.startingRow();
    if (!Number.isInteger(startRow) || startRow < 1 || startRow > statement.rows.length) {
      return `Enter a starting row between 1 and ${statement.rows.length}.`;
    }

    const missingFields = STATEMENT_FIELDS.filter(
      (field) => field.required && this.fieldMappings()[field.path] == null,
    );

    return missingFields.length
      ? `Map required fields: ${missingFields.map((field) => field.label).join(', ')}.`
      : null;
  });

  protected readonly isDisabled = computed(() => this.isUploading());

  protected chooseFile(input: HTMLInputElement): void {
    if (this.isDisabled()) return;
    input.click();
  }

  protected async onFileInputChange(event: Event): Promise<void> {
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.[0] ?? null;
    inputElement.value = '';
    if (!file) return;

    await this.prepareStatement(file);
  }

  protected async onFilesSelected(event: TngFileUploadSelectedEvent): Promise<void> {
    const file = event.files[0];
    if (!file) return;

    await this.prepareStatement(file);
  }

  protected async onFilesRejected(event: TngFileUploadRejectedEvent): Promise<void> {
    const file = event.accepted[0];
    if (file) {
      await this.prepareStatement(file);
      return;
    }

    const first = event.rejected[0];
    this.toastStore.danger(first?.message ?? 'Select one valid XLSX bank statement file.');
  }

  protected onStartingRowChange(row: number): void {
    this.startingRow.set(row);
    if (!this.startingRowIsValid(row)) return;

    this.refreshStatementHeaderContext();
  }

  protected cancelMapping(): void {
    if (this.isUploading()) return;

    this.clearStatement();
  }

  protected onMappingClosed(): void {
    if (!this.isPreviewOpen()) {
      this.clearStatement();
    }
  }

  protected onPreviewClosed(): void {
    if (!this.isUploading()) {
      this.clearStatement();
    }
  }

  protected continueToPreview(): void {
    const rows = this.buildPreviewRows();
    if (typeof rows === 'string') {
      this.toastStore.danger(rows);
      return;
    }

    this.previewRows.set(rows);
    this.isMappingOpen.set(false);
    this.isPreviewOpen.set(true);
  }

  protected backToMapping(): void {
    if (this.isUploading()) return;

    this.isPreviewOpen.set(false);
    this.isMappingOpen.set(true);
  }

  protected removePreviewRow(rowNumber: number): void {
    this.previewRows.update((rows) => rows.filter((row) => row.rowNumber !== rowNumber));
  }

  protected async confirmUpload(): Promise<void> {
    const statement = this.pendingStatement();
    const rows = this.previewRows();
    const selectedBank = this.selectedBankCash();
    if (!statement || !rows.length || !selectedBank || this.isUploading()) return;

    const payloadRows = rows.map(({ rowNumber: _rowNumber, ...row }) => row);
    const uploadFile = new File(
      [JSON.stringify({ bankTxns: payloadRows })],
      `${statement.file.name.replace(/\.[^.]+$/, '') || 'bank-statement'}.json`,
      { lastModified: Date.now(), type: 'application/json' },
    );

    this.isUploading.set(true);
    try {
      const created = await this.bulkUploadService.upload(BANK_STATEMENT_UPLOAD_ENDPOINT, uploadFile);
      const count = Array.isArray(created) ? created.length : 0;
      this.toastStore.success(
        count > 0
          ? `Bank statement import completed. ${count} transaction${count === 1 ? '' : 's'} created.`
          : 'Bank statement import completed.',
      );
      this.uploaded.emit(created);
      this.clearStatement();
    } catch (error) {
      this.toastStore.danger(getApiErrorMessage(error, 'Bank statement import failed.'));
    } finally {
      this.isUploading.set(false);
    }
  }

  private async prepareStatement(file: File): Promise<void> {
    const validationError = this.validateFile(file);
    if (validationError) {
      this.toastStore.danger(validationError);
      return;
    }

    const rows = await readFirstSheetRows(file);
    if (typeof rows === 'string') {
      this.toastStore.danger(rows);
      return;
    }

    const detectedHeaderRowIndex = this.detectHeaderRowIndex(rows);
    const preliminaryMappings = this.buildFieldMappings(rows, detectedHeaderRowIndex);
    const { headerRowIndex, startingRow } = this.resolveStatementHeaderContext(
      rows,
      this.detectStartingRow(rows, detectedHeaderRowIndex, preliminaryMappings),
      detectedHeaderRowIndex,
    );
    const columnOptions = buildColumnOptions(rows, headerRowIndex);
    if (!columnOptions.length) {
      this.toastStore.danger('XLSX file is empty.');
      return;
    }

    this.pendingStatement.set({
      columnOptions,
      detectedHeaderRowIndex,
      file,
      fileSize: this.formatFileSize(file.size),
      headerRowIndex,
      rows,
    });
    this.startingRow.set(startingRow);
    this.fieldMappings.set(this.buildFieldMappings(rows, headerRowIndex));
    this.previewRows.set([]);
    this.isMappingOpen.set(true);
  }

  private validateFile(file: File): string | null {
    if (file.size <= 0) return 'Select a non-empty XLSX file.';
    if (file.size > BANK_STATEMENT_MAX_SIZE) {
      return `Select an XLSX file smaller than ${this.formatFileSize(BANK_STATEMENT_MAX_SIZE)}.`;
    }

    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.xlsx')) return 'Select a valid XLSX bank statement file.';

    return null;
  }

  private detectHeaderRowIndex(rows: readonly StatementRow[]): number {
    const hdfcHeaderIndex = findHeaderRowIndex(rows, ['date', 'narration']);
    if (hdfcHeaderIndex >= 0) return hdfcHeaderIndex;

    const firstNonEmptyIndex = rows.findIndex((row) => row.some((value) => !valueIsEmpty(value)));
    return firstNonEmptyIndex >= 0 ? firstNonEmptyIndex : 0;
  }

  private detectStartingRow(
    rows: readonly StatementRow[],
    searchAfterRowIndex: number,
    mappings: Record<BankStatementFieldPath, number | null>,
  ): number {
    const dateColumn = mappings.txndate;
    if (dateColumn === null) return searchAfterRowIndex + 2;

    const searchEnd = Math.min(
      rows.length,
      searchAfterRowIndex + 1 + BankStatementUploadComponent.STARTING_ROW_SEARCH_WINDOW,
    );

    for (let index = searchAfterRowIndex + 1; index < searchEnd; index++) {
      if (isImportableStatementRow(rows[index], mappings, this.importFiscalRange())) {
        return index + 1;
      }
    }

    return searchAfterRowIndex + 2;
  }

  private resolveStatementHeaderContext(
    rows: readonly StatementRow[],
    startingRow: number,
    detectedHeaderRowIndex: number,
  ): Readonly<{ headerRowIndex: number; startingRow: number }> {
    let headerRowIndex = resolveStatementMappingHeaderRowIndex(
      rows,
      startingRow,
      detectedHeaderRowIndex,
      STATEMENT_FIELDS,
    );

    const preferredHeaderRowIndex = resolveStatementHeaderRowIndex(startingRow, rows.length);
    if (headerRowIndex !== preferredHeaderRowIndex) {
      startingRow = headerRowIndex + 2;
    }

    return { headerRowIndex, startingRow };
  }

  private buildFieldMappings(
    rows: readonly StatementRow[],
    headerRowIndex: number,
  ): Record<BankStatementFieldPath, number | null> {
    return {
      ...createEmptyFieldMappings(),
      ...suggestStatementFieldMappings(rows, headerRowIndex, STATEMENT_FIELDS),
    } as Record<BankStatementFieldPath, number | null>;
  }

  private refreshStatementHeaderContext(): void {
    const statement = this.pendingStatement();
    if (!statement) return;

    const requestedStartingRow = this.startingRow();
    if (!this.startingRowIsValid(requestedStartingRow, statement.rows.length)) return;

    const { headerRowIndex, startingRow } = this.resolveStatementHeaderContext(
      statement.rows,
      requestedStartingRow,
      statement.detectedHeaderRowIndex,
    );

    this.startingRow.set(startingRow);
    this.pendingStatement.set({
      ...statement,
      columnOptions: buildColumnOptions(statement.rows, headerRowIndex),
      headerRowIndex,
    });
    this.fieldMappings.set(this.buildFieldMappings(statement.rows, headerRowIndex));
  }

  private buildPreviewRows(): readonly BankStatementPreviewRow[] | string {
    const statement = this.pendingStatement();
    const selectedBank = this.selectedBankCash();
    if (!statement) return 'Select a bank statement file.';
    if (!selectedBank) return 'Bank account is required.';
    if (this.mappingError()) return this.mappingError() ?? 'Resolve statement mapping errors.';

    const mappings = this.fieldMappings();
    const startIndex = this.startingRow() - 1;
    const outputRows: BankStatementPreviewRow[] = [];

    for (const [rowIndex, row] of statement.rows.entries()) {
      if (rowIndex < startIndex || row.every(valueIsEmpty)) continue;
      if (!isImportableStatementRow(row, mappings, this.importFiscalRange())) continue;

      const date = parseStatementDate(row[mappings.txndate as number]);
      const debitAmount = parseMappedStatementAmount(row, mappings.debit) ?? 0;
      const creditAmount = parseMappedStatementAmount(row, mappings.credit) ?? 0;

      outputRows.push({
        bankname: selectedBank.name,
        ...(this.selectedInventoryLedgerMapId()
          ? { inventoryledgermapid: this.selectedInventoryLedgerMapId() }
          : {}),
        bankref: this.readMappedText(row, mappings.bankref),
        ...(creditAmount > 0 ? { credit: creditAmount } : {}),
        ...(debitAmount > 0 ? { debit: debitAmount } : {}),
        description: this.readMappedText(row, mappings.description),
        rowNumber: rowIndex + 1,
        txndate: date as string,
      });
    }

    return outputRows.length
      ? outputRows
      : 'No transaction rows were found from the configured starting row.';
  }

  private importFiscalRange(): StatementFiscalDateRange | null {
    return this.fiscalYearDateRange.range();
  }

  private readMappedText(row: StatementRow, columnIndex: number | null): string {
    return columnIndex === null ? '' : formatStatementCell(row[columnIndex]).trim();
  }

  private startingRowIsValid(row: number, rowCount = this.pendingStatement()?.rows.length ?? 0): boolean {
    return Number.isInteger(row) && row >= 1 && row <= rowCount;
  }

  private clearStatement(): void {
    this.isMappingOpen.set(false);
    this.isPreviewOpen.set(false);
    this.pendingStatement.set(null);
    this.previewRows.set([]);
    this.selectedBankCashId.set('');
    this.bankCashQuery.set('');
    this.startingRow.set(1);
    this.fieldMappings.set(createEmptyFieldMappings());
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
