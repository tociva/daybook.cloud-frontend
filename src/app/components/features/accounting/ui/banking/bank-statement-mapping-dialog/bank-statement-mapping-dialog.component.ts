import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import {
  TngAutocompleteComponent,
  TngButtonComponent,
  TngDialogComponent,
  TngError,
  TngFormFieldComponent,
  TngInputComponent,
  TngLabelComponent,
  TngSelectComponent,
} from '@tailng-ui/components';
import {
  columnName,
  formatStatementCell,
  parseStatementDate,
  type StatementColumnOption,
} from '../../../../../../shared/bank-statement-xlsx';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { BankCashStore } from '../../../../trading/data/bank-cash';
import type { BankCash } from '../../../../trading/data/bank-cash';
import {
  STATEMENT_FIELDS,
  type BankStatementField,
  type BankStatementFieldMappings,
  type PendingStatement,
} from '../bank-statement-upload/bank-statement-upload.model';

type StatementColumnSelectOption = Readonly<{
  index: number | null;
  label: string;
}>;

@Component({
  selector: 'app-bank-statement-mapping-dialog',
  standalone: true,
  imports: [
    TngAutocompleteComponent,
    TngButtonComponent,
    TngDialogComponent,
    TngError,
    TngFormFieldComponent,
    TngInputComponent,
    TngLabelComponent,
    TngSelectComponent,
  ],
  templateUrl: './bank-statement-mapping-dialog.component.html',
  styleUrl: './bank-statement-mapping-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BankStatementMappingDialogComponent {
  private readonly bankCashStore = inject(BankCashStore);
  private readonly dateManagement = inject(DateManagementService);

  readonly open = input.required<boolean>();
  readonly statement = input.required<PendingStatement>();
  readonly isUploading = input(false);
  readonly selectedBankCashId = input('');
  readonly bankCashQuery = input('');
  readonly startingRow = input(1);
  readonly fieldMappings = input<BankStatementFieldMappings>({
    bankref: null,
    credit: null,
    debit: null,
    description: null,
    txndate: null,
  });
  readonly mappingError = input<string | null>(null);

  readonly closed = output<void>();
  readonly cancelled = output<void>();
  readonly continued = output<void>();
  readonly selectedBankCashIdChange = output<string>();
  readonly bankCashQueryChange = output<string>();
  readonly startingRowChange = output<number>();
  readonly fieldMappingsChange = output<BankStatementFieldMappings>();

  protected readonly fields = STATEMENT_FIELDS;

  protected readonly filteredBankCashes = computed<readonly BankCash[]>(() => {
    const query = this.bankCashQuery().trim().toLowerCase();
    const items = this.bankCashStore.items() as BankCash[];
    if (!query) return items.slice(0, 25);

    return items
      .filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          (item.description ?? '').toLowerCase().includes(query),
      )
      .slice(0, 25);
  });

  protected readonly startingRowValue = computed(() => String(this.startingRow()));

  protected readonly startingRowInvalid = computed(() => {
    const statement = this.statement();
    const startRow = this.startingRow();
    return !Number.isInteger(startRow) || startRow < 1 || startRow > statement.rows.length;
  });

  protected readonly columnSelectOptions = computed((): readonly StatementColumnSelectOption[] => [
    { index: null, label: 'Not mapped' },
    ...this.statement().columnOptions.map(
      (column: StatementColumnOption): StatementColumnSelectOption => ({
        index: column.index,
        label: column.label,
      }),
    ),
  ]);

  protected readonly mappingPreviewRows = computed(() => {
    const statement = this.statement();
    const dateColumnIndex = this.fieldMappings().txndate;

    return statement.rows
      .map((row, index) => ({
        rowNumber: index + 1,
        values: statement.columnOptions.map((column) =>
          this.formatPreviewCell(row[column.index], column.index, dateColumnIndex),
        ),
      }))
      .filter((row) => row.values.some((value) => value !== ''))
      .slice(0, 100);
  });

  protected readonly bankCashOptionValue = (bank: BankCash): string => bank.id ?? '';
  protected readonly bankCashOptionLabel = (bank: BankCash): string => bank.name;
  protected readonly bankCashTrackBy = (_index: number, bank: BankCash): string => bank.id ?? bank.name;

  protected setStartingRow(value: string | null): void {
    this.startingRowChange.emit(Number(value ?? ''));
  }

  protected setBankCash(value: unknown): void {
    this.selectedBankCashIdChange.emit(typeof value === 'string' ? value : '');
  }

  protected setBankCashQuery(value: unknown): void {
    this.bankCashQueryChange.emit(typeof value === 'string' ? value : '');
  }

  protected setFieldMapping(field: BankStatementField, value: unknown): void {
    const text = typeof value === 'string' ? value : value == null ? '' : String(value);
    const columnIndex = text === '' ? null : Number(text);
    this.fieldMappingsChange.emit({
      ...this.fieldMappings(),
      [field.path]: Number.isFinite(columnIndex) ? columnIndex : null,
    });
  }

  protected fieldSelectValue(field: BankStatementField): string {
    const value = this.fieldMappings()[field.path];
    return value === null || value === undefined ? '' : String(value);
  }

  protected fieldSelectId(field: BankStatementField): string {
    return `statement-field-${field.path}`;
  }

  protected readonly columnOptionLabel = (option: StatementColumnSelectOption): string => option.label;
  protected readonly columnOptionValue = (option: StatementColumnSelectOption): string =>
    option.index === null ? '' : String(option.index);
  protected readonly columnOptionTrackBy = (
    _index: number,
    option: StatementColumnSelectOption,
  ): string => (option.index === null ? 'unmapped' : String(option.index));

  protected columnName(index: number): string {
    return columnName(index);
  }

  protected formatPreviewCell(
    value: unknown,
    columnIndex: number,
    dateColumnIndex: number | null,
  ): string {
    if (dateColumnIndex !== null && columnIndex === dateColumnIndex) {
      const isoDate = parseStatementDate(value);
      if (isoDate) {
        return this.dateManagement.formatDisplayDate(isoDate);
      }
    }

    return formatStatementCell(value);
  }

  protected onDialogClosed(): void {
    this.closed.emit();
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }

  protected onContinue(): void {
    this.continued.emit();
  }
}
