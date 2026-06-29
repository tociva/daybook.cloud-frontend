import { Injectable } from '@angular/core';
import type { XlsxCell, XlsxExportDocument, XlsxRow } from './xlsx-export.model';

const TITLE_FILL = '1E3A5F';
const HEADER_FILL = '27496D';
const HEADER_FONT = 'FFFFFF';
const ALT_FILL = 'F8FAFC';
const BORDER: Partial<import('exceljs').Border> = { style: 'thin', color: { argb: 'D8DEE9' } };
const XLSX_MAX_ROWS = 1_048_576;

@Injectable({ providedIn: 'root' })
export class XlsxExportService {
  async download(document: XlsxExportDocument): Promise<void> {
    if (document.rowCount !== undefined && document.rowCount <= 0) {
      return;
    }

    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Daybook Cloud';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(document.worksheet.name);
    const columnCount = Math.max(document.worksheet.columns.length, 1);
    let currentRow = 1;

    if (document.worksheet.title) {
      const titleRow = sheet.getRow(currentRow);
      titleRow.getCell(1).value = asExcelValue({ kind: 'text', value: document.worksheet.title });
      titleRow.height = 24;
      sheet.mergeCells(currentRow, 1, currentRow, columnCount);
      titleRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: HEADER_FONT }, size: 14 };
        cell.fill = solidFill(TITLE_FILL);
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      });
      currentRow += 1;
    }

    const headerRows = document.worksheet.headerRows?.length
      ? document.worksheet.headerRows
      : [document.worksheet.columns.map((column) => ({ kind: 'text' as const, value: column.header }))];

    for (const row of headerRows) {
      writeRow(sheet, currentRow, row, document.worksheet.columns, true);
      currentRow += 1;
    }

    for (const merge of document.worksheet.merges ?? []) {
      sheet.mergeCells(merge.startRow, merge.startColumn, merge.endRow, merge.endColumn);
    }

    for (const [index, row] of document.worksheet.rows.entries()) {
      if (currentRow > XLSX_MAX_ROWS) {
        throw new Error(`Excel supports at most ${XLSX_MAX_ROWS.toLocaleString()} worksheet rows.`);
      }

      writeRow(sheet, currentRow, row, document.worksheet.columns, false, index % 2 === 1);
      currentRow += 1;
    }

    sheet.columns = document.worksheet.columns.map((column) => ({
      key: column.key,
      width: column.width ?? defaultColumnWidth(column.header),
    }));

    sheet.views = [
      {
        state: 'frozen',
        xSplit: 0,
        ySplit: document.worksheet.freezeRows ?? headerRows.length + (document.worksheet.title ? 1 : 0),
      },
    ];

    if (document.worksheet.autoFilter !== false && currentRow > headerRows.length + 1) {
      const headerRow = document.worksheet.title ? 2 + headerRows.length - 1 : headerRows.length;
      sheet.autoFilter = {
        from: { row: headerRow, column: 1 },
        to: { row: headerRow, column: columnCount },
      };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    triggerDownload(blob, document.fileName);
  }
}

function writeRow(
  sheet: import('exceljs').Worksheet,
  rowNumber: number,
  row: XlsxRow,
  columns: readonly { align?: string; format?: string; kind?: string }[],
  isHeader: boolean,
  alternate = false,
): void {
  const sheetRow = sheet.getRow(rowNumber);

  row.forEach((rawCell, columnIndex) => {
    const cell = normalizeCell(rawCell);
    const sheetCell = sheetRow.getCell(columnIndex + 1);
    const column = columns[columnIndex];

    sheetCell.value = asExcelValue(cell);
    sheetCell.border = { bottom: BORDER, left: BORDER, right: BORDER, top: BORDER };
    const horizontal = (cell.style?.align ?? column?.align ?? (cell.kind === 'number' ? 'right' : 'left')) as
      | 'left'
      | 'center'
      | 'right';
    sheetCell.alignment = {
      horizontal,
      indent: cell.style?.indent,
      vertical: 'middle',
      wrapText: cell.style?.wrap ?? true,
    };

    if (isHeader) {
      sheetCell.font = { bold: true, color: { argb: HEADER_FONT } };
      sheetCell.fill = solidFill(cell.style?.fill ?? HEADER_FILL);
    } else {
      sheetCell.font = {
        bold: cell.style?.bold,
        color: cell.style?.fontColor ? { argb: cell.style.fontColor } : undefined,
      };
      if (alternate || cell.style?.fill) {
        sheetCell.fill = solidFill(cell.style?.fill ?? ALT_FILL);
      }
    }

    const format = cell.style?.format ?? column?.format;
    if (format) {
      sheetCell.numFmt = format;
    }
  });
}

function normalizeCell(cell: XlsxRow[number]): XlsxCell {
  if (typeof cell === 'object' && cell !== null && 'value' in cell) {
    return cell;
  }

  return { value: cell };
}

function asExcelValue(cell: XlsxCell): string | number | boolean | Date | null {
  if (cell.value === undefined || cell.value === null) {
    return null;
  }

  if (cell.kind === 'text') {
    return String(cell.value);
  }

  return cell.value;
}

function solidFill(argb: string): import('exceljs').Fill {
  return { fgColor: { argb }, pattern: 'solid', type: 'pattern' };
}

function defaultColumnWidth(header: string): number {
  return Math.max(10, Math.min(30, header.length + 4));
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
