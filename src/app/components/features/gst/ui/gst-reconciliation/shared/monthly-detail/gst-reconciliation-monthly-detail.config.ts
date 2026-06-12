import type { GstReconciliationReturnType } from '../../../../data/gst-reconciliation/gst-reconciliation.store';

export type GstReconciliationMonthlyDetailConfig = Readonly<{
  bookInvoiceViewRoutePrefix: string;
  createBookInvoiceLabel: string;
  createBookInvoiceRoute: string;
  createPartyLabel: string;
  createPartyRoute: string;
  detailsColumnLabel: string;
  includeBookInvoiceItemNames: boolean;
  missingPartyMessage: string;
  partyType: 'customer' | 'vendor';
  returnType: GstReconciliationReturnType;
  returnTypeLabel: string;
  supportsExportInvoice: boolean;
}>;

export const GSTR1_MONTHLY_DETAIL_CONFIG: GstReconciliationMonthlyDetailConfig = {
  bookInvoiceViewRoutePrefix: '/app/trading/sale-invoice',
  createBookInvoiceLabel: 'Create sale invoice',
  createBookInvoiceRoute: '/app/trading/sale-invoice/create',
  createPartyLabel: 'Create new customer',
  createPartyRoute: '/app/trading/customer/create',
  detailsColumnLabel: 'Reason',
  includeBookInvoiceItemNames: false,
  missingPartyMessage: 'Customer not exists in our record,',
  partyType: 'customer',
  returnType: 'gstr1',
  returnTypeLabel: 'GSTR-1',
  supportsExportInvoice: true,
};

export const GSTR2B_MONTHLY_DETAIL_CONFIG: GstReconciliationMonthlyDetailConfig = {
  bookInvoiceViewRoutePrefix: '/app/trading/purchase-invoice',
  createBookInvoiceLabel: 'Create purchase invoice',
  createBookInvoiceRoute: '/app/trading/purchase-invoice/create',
  createPartyLabel: 'Create new vendor',
  createPartyRoute: '/app/trading/vendor/create',
  detailsColumnLabel: 'Details',
  includeBookInvoiceItemNames: true,
  missingPartyMessage: 'Vendor not exists in our record,',
  partyType: 'vendor',
  returnType: 'gstr2b',
  returnTypeLabel: 'GSTR-2B',
  supportsExportInvoice: false,
};
