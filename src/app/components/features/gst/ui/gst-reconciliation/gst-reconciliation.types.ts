import type { GstReconciliationReturnType } from '../../data/gst-reconciliation/gst-reconciliation.model';

export type ParsedInvoice = Readonly<{
  invoiceNo: string;
  invoiceDate: string;
  invoiceValue: number;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  period: string;
  // GSTR-2B (inward)
  gstin?: string;
  supplierName?: string;
  itcAvailable?: boolean;
  // GSTR-1 (outward)
  exportType?: string;
  taxRate?: number;
}>;

export type ParsedFilePreview = Readonly<{
  detectedReturnType: GstReconciliationReturnType | null;
  period: string;
  gstin?: string;
  invoices: readonly ParsedInvoice[];
  totalInvoiceValue: number;
  totalTaxableValue: number;
  totalIgst: number;
  totalCgst: number;
  totalSgst: number;
}>;

export type ReturnTypeMeta = Readonly<{
  description: string;
  icon: string;
  label: string;
  value: GstReconciliationReturnType;
}>;

export const RETURN_TYPES: readonly ReturnTypeMeta[] = [
  { description: 'Portal GSTR-1 against book sale invoices',      icon: 'fileText',  label: 'GSTR-1',  value: 'gstr1'  },
  { description: 'Portal GSTR-2B against book purchase invoices', icon: 'fileCheck', label: 'GSTR-2B', value: 'gstr2b' },
] as const;
