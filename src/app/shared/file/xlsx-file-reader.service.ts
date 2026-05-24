import { Injectable } from '@angular/core';

export type XlsxCellValue = boolean | Date | number | string | null;
export type XlsxRow = readonly XlsxCellValue[];

@Injectable({ providedIn: 'root' })
export class XlsxFileReaderService {
  async readFirstSheetRows(file: File): Promise<readonly XlsxRow[]> {
    const xlsx = await import('xlsx');
    const workbook = xlsx.read(await file.arrayBuffer(), { cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return [];

    return xlsx.utils.sheet_to_json<XlsxCellValue[]>(
      workbook.Sheets[firstSheetName],
      { defval: '', header: 1, raw: true },
    );
  }

  formatCell(value: unknown): string {
    if (value === null || value === undefined || value === '') return '';
    if (value instanceof Date) {
      const day = String(value.getDate()).padStart(2, '0');
      const month = String(value.getMonth() + 1).padStart(2, '0');
      return `${day}/${month}/${value.getFullYear()}`;
    }
    return String(value);
  }
}
