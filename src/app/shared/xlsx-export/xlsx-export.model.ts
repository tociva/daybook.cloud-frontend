export type XlsxCellPrimitive = string | number | boolean | Date | null | undefined;

export type XlsxHorizontalAlignment = 'left' | 'center' | 'right';

export type XlsxCellKind = 'text' | 'number' | 'date' | 'boolean';

export type XlsxCellStyle = Readonly<{
  align?: XlsxHorizontalAlignment;
  bold?: boolean;
  fill?: string;
  fontColor?: string;
  format?: string;
  indent?: number;
  wrap?: boolean;
}>;

export type XlsxCell = Readonly<{
  kind?: XlsxCellKind;
  style?: XlsxCellStyle;
  value: XlsxCellPrimitive;
}>;

export type XlsxRow = readonly (XlsxCellPrimitive | XlsxCell)[];

export type XlsxColumn = Readonly<{
  header: string;
  key?: string;
  width?: number;
  kind?: XlsxCellKind;
  format?: string;
  align?: XlsxHorizontalAlignment;
}>;

export type XlsxMergeRange = Readonly<{
  startRow: number;
  startColumn: number;
  endRow: number;
  endColumn: number;
}>;

export type XlsxWorksheet = Readonly<{
  name: string;
  title?: string;
  columns: readonly XlsxColumn[];
  rows: readonly XlsxRow[];
  headerRows?: readonly XlsxRow[];
  merges?: readonly XlsxMergeRange[];
  freezeRows?: number;
  autoFilter?: boolean;
}>;

export type XlsxExportDocument = Readonly<{
  fileName: string;
  rowCount?: number;
  worksheet: XlsxWorksheet;
}>;

export type XlsxExportCallback = () => Promise<XlsxExportDocument>;
