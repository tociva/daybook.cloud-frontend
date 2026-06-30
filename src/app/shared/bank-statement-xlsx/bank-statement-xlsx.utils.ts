import Fuse, { type IFuseOptions } from 'fuse.js';
import * as xlsx from 'xlsx';

export type StatementCell = string | number | boolean | Date | null | undefined;
export type StatementRow = readonly StatementCell[];

export type StatementColumnOption = Readonly<{
  index: number;
  label: string;
}>;

export async function readFirstSheetRows(file: File): Promise<readonly StatementRow[] | string> {
  try {
    const workbook = xlsx.read(await file.arrayBuffer(), { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return 'XLSX file does not contain any sheets.';

    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return 'Unable to read the first sheet in the XLSX file.';

    return xlsx.utils.sheet_to_json<StatementCell[]>(worksheet, {
      defval: '',
      header: 1,
      raw: true,
    }) as StatementRow[];
  } catch {
    return 'Unable to read the XLSX file.';
  }
}

export function buildColumnOptions(
  rows: readonly StatementRow[],
  headerRowIndex?: number,
): readonly StatementColumnOption[] {
  const usedRows = rows.filter((row) => row.some((value) => !valueIsEmpty(value)));
  const columnCount = usedRows.length ? Math.max(...usedRows.map((row) => row.length)) : 0;
  const headerRow =
    headerRowIndex !== undefined && headerRowIndex >= 0 ? rows[headerRowIndex] : undefined;

  return Array.from({ length: columnCount }, (_value, index) => ({
    index,
    label: `${columnName(index)} (${
      formatStatementCell(headerRow?.[index]).trim() || firstNonEmptyColumnValue(rows, index)
    })`,
  }));
}

export function columnName(index: number): string {
  let value = '';
  let current = index + 1;

  while (current > 0) {
    const remainder = (current - 1) % 26;
    value = String.fromCharCode(65 + remainder) + value;
    current = Math.floor((current - 1) / 26);
  }

  return value;
}

export function firstNonEmptyColumnValue(rows: readonly StatementRow[], columnIndex: number): string {
  for (const row of rows) {
    const value = formatStatementCell(row[columnIndex]);
    if (value) return value;
  }

  return 'blank';
}

export function formatStatementCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return formatDateForPayload(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

export function valueIsEmpty(value: unknown): boolean {
  if (typeof value === 'string') return value.trim() === '';
  return value === null || value === undefined;
}

export function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Normalizes header text for exact and fuzzy column matching. */
export function normalizeHeaderForMatch(value: string): string {
  return normalizeHeader(value)
    .replace(/[./()[\]#:,_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export type StatementFieldMappingSpec = Readonly<{
  aliases: readonly string[];
  label: string;
  path: string;
}>;

type StatementColumnCandidate = Readonly<{
  header: string;
  index: number;
  normalized: string;
}>;

const STATEMENT_COLUMN_FUSE_THRESHOLD = 0.4;

const STATEMENT_COLUMN_FUSE_OPTIONS: IFuseOptions<StatementColumnCandidate> = {
  ignoreLocation: true,
  includeScore: true,
  keys: ['normalized', 'header'],
  threshold: STATEMENT_COLUMN_FUSE_THRESHOLD,
};

/** 0-based header row index: the row immediately above a 1-based transaction starting row. */
export function resolveStatementHeaderRowIndex(startingRow: number, rowCount: number): number {
  if (!Number.isFinite(startingRow) || rowCount <= 0) return 0;

  const headerIndex = startingRow - 2;
  return Math.max(0, Math.min(headerIndex, rowCount - 1));
}

/** Whether a row has enough recognizable column headers to map at least the date field. */
export function statementHeaderRowIsMappable(
  rows: readonly StatementRow[],
  headerRowIndex: number,
  fields: readonly StatementFieldMappingSpec[],
): boolean {
  const mappings = suggestStatementFieldMappings(rows, headerRowIndex, fields);
  return mappings['txndate'] != null;
}

/**
 * Picks the header row used for column labels and fuse mapping.
 * Prefers the row above the transaction starting row; falls back to the detected header.
 */
export function resolveStatementMappingHeaderRowIndex(
  rows: readonly StatementRow[],
  startingRow: number,
  detectedHeaderRowIndex: number,
  fields: readonly StatementFieldMappingSpec[],
): number {
  const preferredHeaderRowIndex = resolveStatementHeaderRowIndex(startingRow, rows.length);

  if (statementHeaderRowIsMappable(rows, preferredHeaderRowIndex, fields)) {
    return preferredHeaderRowIndex;
  }

  if (statementHeaderRowIsMappable(rows, detectedHeaderRowIndex, fields)) {
    return detectedHeaderRowIndex;
  }

  return preferredHeaderRowIndex;
}

export function findHeaderRowIndex(
  rows: readonly StatementRow[],
  requiredAliases: readonly string[],
): number {
  const normalizedAliases = requiredAliases.map(normalizeHeader);
  return rows.findIndex((row) => {
    const normalizedCells = row.map((cell) => normalizeHeader(formatStatementCell(cell)));
    return normalizedAliases.every((alias) => normalizedCells.includes(alias));
  });
}

export function findColumnIndexByAliases(
  rows: readonly StatementRow[],
  aliases: readonly string[],
  headerRowIndex: number,
  excludedIndices: ReadonlySet<number> = new Set(),
): number | null {
  const headerRow = rows[headerRowIndex];
  if (!headerRow) return null;

  const normalizedAliases = aliases.map(normalizeHeaderForMatch);
  const index = headerRow.findIndex((cell, columnIndex) => {
    if (excludedIndices.has(columnIndex)) return false;

    return normalizedAliases.includes(normalizeHeaderForMatch(formatStatementCell(cell)));
  });

  return index >= 0 ? index : null;
}

/**
 * Suggests statement column mappings using exact alias matches first, then fuse.js fuzzy
 * matching. Each spreadsheet column is assigned at most once.
 */
export function suggestStatementFieldMappings(
  rows: readonly StatementRow[],
  headerRowIndex: number,
  fields: readonly StatementFieldMappingSpec[],
): Record<string, number | null> {
  const headerRow = rows[headerRowIndex];
  if (!headerRow) {
    return Object.fromEntries(fields.map((field) => [field.path, null]));
  }

  const columns: StatementColumnCandidate[] = headerRow.map((cell, index) => {
    const header = formatStatementCell(cell).trim();
    return {
      header,
      index,
      normalized: normalizeHeaderForMatch(header),
    };
  });

  const usedColumnIndices = new Set<number>();
  const mappings: Record<string, number | null> = {};

  for (const field of fields) {
    const exactMatch = findColumnIndexByAliases(
      rows,
      field.aliases,
      headerRowIndex,
      usedColumnIndices,
    );
    if (exactMatch !== null) {
      mappings[field.path] = exactMatch;
      usedColumnIndices.add(exactMatch);
      continue;
    }

    const availableColumns = columns.filter(
      (column) => !usedColumnIndices.has(column.index) && column.normalized.length > 0,
    );
    if (!availableColumns.length) {
      mappings[field.path] = null;
      continue;
    }

    const fuse = new Fuse(availableColumns, STATEMENT_COLUMN_FUSE_OPTIONS);
    const searchTerms = [...new Set([...field.aliases, field.label].map(normalizeHeaderForMatch))].filter(
      (term) => term.length > 0,
    );

    let bestColumnIndex: number | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const term of searchTerms) {
      const [match] = fuse.search(term, { limit: 1 });
      if (
        match?.item &&
        match.score !== undefined &&
        match.score <= STATEMENT_COLUMN_FUSE_THRESHOLD &&
        match.score < bestScore
      ) {
        bestScore = match.score;
        bestColumnIndex = match.item.index;
      }
    }

    if (bestColumnIndex !== null) {
      mappings[field.path] = bestColumnIndex;
      usedColumnIndices.add(bestColumnIndex);
      continue;
    }

    mappings[field.path] = null;
  }

  return mappings;
}

export type StatementAmountMappings = Readonly<{
  credit: number | null;
  debit: number | null;
  txndate: number | null;
}>;

export type StatementFiscalDateRange = Readonly<{
  enddate: string;
  startdate: string;
}>;

/** Excel serial ~1954-01-01 */
const STATEMENT_MIN_EXCEL_SERIAL = 20_000;

/** Excel serial ~2078-10-03 */
const STATEMENT_MAX_EXCEL_SERIAL = 65_000;

const EXCEL_EPOCH_UTC_MS = Date.UTC(1899, 11, 30);

export function isPlausibleExcelSerial(value: number): boolean {
  if (!Number.isFinite(value) || value <= 0) return false;

  const serial = Math.floor(value);
  return serial >= STATEMENT_MIN_EXCEL_SERIAL && serial <= STATEMENT_MAX_EXCEL_SERIAL;
}

export function isStatementDateWithinFiscalYear(
  isoDate: string,
  fiscalRange: StatementFiscalDateRange | null | undefined,
): boolean {
  if (!fiscalRange) return true;

  return isoDate >= fiscalRange.startdate && isoDate <= fiscalRange.enddate;
}

function parseExcelSerialToIsoDate(serial: number): string | null {
  const date = new Date(EXCEL_EPOCH_UTC_MS + serial * 86_400_000);
  if (Number.isNaN(date.getTime())) return null;

  return formatDateForPayload(date);
}

export function parseMappedStatementAmount(
  row: StatementRow,
  columnIndex: number | null,
): number | undefined {
  if (columnIndex === null) return undefined;

  const amount = parseStatementAmount(row[columnIndex]);
  return typeof amount === 'number' ? amount : undefined;
}

/** Rows without a valid in-fiscal-year date or with no inflow/outflow above zero are skipped. */
export function isImportableStatementRow(
  row: StatementRow,
  mappings: StatementAmountMappings,
  fiscalRange?: StatementFiscalDateRange | null,
): boolean {
  if (mappings.txndate === null) return false;

  const date = parseStatementDate(row[mappings.txndate]);
  if (!date || !isStatementDateWithinFiscalYear(date, fiscalRange)) return false;

  const debit = parseMappedStatementAmount(row, mappings.debit) ?? 0;
  const credit = parseMappedStatementAmount(row, mappings.credit) ?? 0;

  return debit > 0 || credit > 0;
}

export function parseStatementDate(value: unknown): string | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return formatDateForPayload(value);
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return isPlausibleExcelSerial(value) ? parseExcelSerialToIsoDate(value) : null;
  }

  const text = String(value ?? '').trim();
  if (!text) return null;

  const delimitedDate = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2}|\d{4})$/);
  if (delimitedDate) {
    const day = Number(delimitedDate[1]);
    const month = Number(delimitedDate[2]);
    const yearText = delimitedDate[3];
    const year =
      yearText.length === 2 ? normalizeTwoDigitYear(Number(yearText)) : Number(yearText);
    return formatDatePartsForPayload(year, month, day);
  }

  if (/^\d+(\.\d+)?$/.test(text)) {
    const serial = Number(text);
    return isPlausibleExcelSerial(serial) ? parseExcelSerialToIsoDate(serial) : null;
  }

  return null;
}

export function parseStatementAmount(value: unknown): number | undefined | string {
  if (valueIsEmpty(value)) return undefined;

  const normalized =
    typeof value === 'string' ? value.replace(/[,₹$€£\s]/g, '') : value;
  const numericValue = typeof normalized === 'number' ? normalized : Number(normalized);

  return Number.isFinite(numericValue)
    ? numericValue
    : `Amount "${formatStatementCell(value)}" is not a valid number.`;
}

export function formatDateForPayload(value: Date): string {
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${value.getFullYear()}-${month}-${day}`;
}

function normalizeTwoDigitYear(year: number): number {
  return year >= 70 ? 1900 + year : 2000 + year;
}

function formatDatePartsForPayload(year: number, month: number, day: number): string | null {
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  const monthText = String(month).padStart(2, '0');
  const dayText = String(day).padStart(2, '0');
  return `${year}-${monthText}-${dayText}`;
}
