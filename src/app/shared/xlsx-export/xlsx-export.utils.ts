import type { Lb4ListQuery } from '../crud';
import type { XlsxCell, XlsxColumn, XlsxExportDocument, XlsxRow } from './xlsx-export.model';

const XLSX_MAX_ROWS = 1_048_576;
const DEFAULT_EXPORT_PAGE_SIZE = 500;

export type CrudListFetcher<T> = (query: Lb4ListQuery) => Promise<readonly T[]>;
export type CrudCountFetcher = (query: Lb4ListQuery) => Promise<number>;

export type XlsxListExportOptions<T> = Readonly<{
  columns: readonly XlsxColumn[];
  fileNameBase: string;
  list: CrudListFetcher<T>;
  mapRow: (row: T, index: number) => XlsxRow;
  query: Lb4ListQuery;
  sheetName: string;
  title?: string;
  cachedRows?: readonly T[];
  cachedTotal?: number;
  count?: CrudCountFetcher;
  headerRows?: readonly XlsxRow[];
  merges?: XlsxExportDocument['worksheet']['merges'];
  pageSize?: number;
}>;

export async function fetchAllLb4Rows<T>(
  list: CrudListFetcher<T>,
  query: Lb4ListQuery,
  options: Readonly<{ count?: CrudCountFetcher; pageSize?: number }> = {},
): Promise<readonly T[]> {
  const pageSize = options.pageSize ?? DEFAULT_EXPORT_PAGE_SIZE;
  const baseQuery = exportQuery(query);
  const total = options.count ? await options.count(baseQuery) : undefined;
  const rows: T[] = [];

  if (total !== undefined && total > XLSX_MAX_ROWS - 3) {
    throw new Error(`Excel supports at most ${XLSX_MAX_ROWS.toLocaleString()} worksheet rows.`);
  }

  for (let offset = 0; total === undefined || offset < total; offset += pageSize) {
    const page = await list({ ...baseQuery, limit: pageSize, offset });
    rows.push(...page);

    if (page.length < pageSize) {
      break;
    }
  }

  return rows;
}

export async function createCrudListXlsxDocument<T>(
  options: XlsxListExportOptions<T>,
): Promise<XlsxExportDocument> {
  const rows = cachedRowsCoverResult(options.cachedRows, options.cachedTotal)
    ? options.cachedRows
    : await fetchAllLb4Rows(options.list, options.query, {
        count: options.count,
        pageSize: options.pageSize,
      });

  return createXlsxListDocument({
    columns: options.columns,
    fileNameBase: options.fileNameBase,
    headerRows: options.headerRows,
    merges: options.merges,
    rows: rows.map(options.mapRow),
    sheetName: options.sheetName,
    title: options.title,
  });
}

function cachedRowsCoverResult<T>(
  cachedRows: readonly T[] | undefined,
  cachedTotal: number | undefined,
): cachedRows is readonly T[] {
  return cachedRows !== undefined && cachedTotal !== undefined && cachedRows.length >= cachedTotal;
}

export function createXlsxListDocument(options: Readonly<{
  columns: readonly XlsxColumn[];
  fileNameBase: string;
  rows: readonly XlsxRow[];
  sheetName: string;
  title?: string;
  headerRows?: readonly XlsxRow[];
  merges?: XlsxExportDocument['worksheet']['merges'];
}>): XlsxExportDocument {
  const fileNameBase = sanitizeFileName(options.fileNameBase);
  return {
    fileName: `${fileNameBase}-${new Date().toISOString().slice(0, 10)}.xlsx`,
    rowCount: options.rows.length,
    worksheet: {
      autoFilter: true,
      columns: options.columns,
      freezeRows: options.headerRows?.length ? options.headerRows.length + 1 : 2,
      headerRows: options.headerRows,
      merges: options.merges,
      name: sanitizeWorksheetName(options.sheetName),
      rows: options.rows,
      title: options.title ?? options.sheetName,
    },
  };
}

export function createXlsxReportDocument(options: Readonly<{
  columns: readonly XlsxColumn[];
  fileNameBase: string;
  rows: readonly XlsxRow[];
  sheetName: string;
  title: string;
  autoFilter?: boolean;
  freezeRows?: number;
  headerRows?: readonly XlsxRow[];
  merges?: XlsxExportDocument['worksheet']['merges'];
  rowCount?: number;
}>): XlsxExportDocument {
  const fileNameBase = sanitizeFileName(options.fileNameBase);
  return {
    fileName: `${fileNameBase}-${new Date().toISOString().slice(0, 10)}.xlsx`,
    rowCount: options.rowCount ?? options.rows.length,
    worksheet: {
      autoFilter: options.autoFilter ?? false,
      columns: options.columns,
      freezeRows: options.freezeRows,
      headerRows: options.headerRows,
      merges: options.merges,
      name: sanitizeWorksheetName(options.sheetName),
      rows: options.rows,
      title: options.title,
    },
  };
}

export function exportQuery(query: Lb4ListQuery): Lb4ListQuery {
  return {
    ...(query.includes?.length ? { includes: query.includes } : {}),
    ...(query.order?.length ? { order: query.order } : {}),
    ...(query.where ? { where: query.where } : {}),
  };
}

export function text(value: unknown): XlsxCell {
  return { kind: 'text', value: value === null || value === undefined ? '' : String(value) };
}

export function number(value: unknown, format = '#,##0.00'): XlsxCell {
  const parsed = typeof value === 'number' ? value : Number(value);
  return { kind: 'number', style: { align: 'right', format }, value: Number.isFinite(parsed) ? parsed : null };
}

export function date(value: unknown): XlsxCell {
  if (!value) {
    return { kind: 'date', value: null };
  }

  const parsed = value instanceof Date ? value : new Date(String(value));
  return {
    kind: 'date',
    style: { format: 'yyyy-mm-dd' },
    value: Number.isNaN(parsed.getTime()) ? null : parsed,
  };
}

export function bool(value: unknown): XlsxCell {
  return { kind: 'boolean', value: Boolean(value) };
}

export function joinLabels(values: readonly unknown[] | undefined): string {
  return (values ?? [])
    .map((value) => (value === null || value === undefined ? '' : String(value).trim()))
    .filter(Boolean)
    .join(', ');
}

export function journalNumbersBySourceId(
  groups: readonly Readonly<{ sourceid: string; journals?: readonly Readonly<{ number?: string }>[] }>[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const group of groups) {
    map.set(group.sourceid, joinLabels(group.journals?.map((journal) => journal.number)));
  }
  return map;
}

export function sanitizeFileName(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

  return cleaned || 'export';
}

export function sanitizeWorksheetName(name: string): string {
  const cleaned = name.replace(/[\\/*?:[\]]+/g, ' ').replace(/\s+/g, ' ').trim();
  return (cleaned || 'Export').slice(0, 31);
}

export function readPath(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }

    return (current as Record<string, unknown>)[key];
  }, source);
}

export function columnsFromTable(
  columns: readonly { id: string; label?: string; align?: string | null; width?: string | number | null }[],
  excludedIds: readonly string[] = ['actions', 'source'],
): readonly XlsxColumn[] {
  return columns
    .filter((column) => !excludedIds.includes(column.id))
    .map((column) => ({
      header: column.label ?? column.id,
      key: column.id,
      width: parseWidth(column.width),
      align: column.align === 'end' ? 'right' : 'left',
    }));
}

export function rowFromPaths(row: unknown, paths: readonly string[]): XlsxRow {
  return paths.map((path) => text(readPath(row, path)));
}

function parseWidth(width: string | number | null | undefined): number | undefined {
  if (!width) {
    return undefined;
  }

  const value = typeof width === 'number' ? width : Number.parseFloat(width);
  return Number.isFinite(value) ? Math.max(8, Math.min(32, Math.round(value * 1.4))) : undefined;
}
