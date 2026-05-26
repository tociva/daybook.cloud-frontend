export type InvoiceDocumentResourceType = 'saleInvoice' | 'purchaseInvoice' | 'purchaseReturn';

export type StoredDocumentProps = Readonly<{
  mimeType?: string;
  originalFileName?: string;
  source?: string;
  [key: string]: unknown;
}>;

export type StoredDocument = Readonly<{
  id?: string;
  name: string;
  path?: string;
  size: number;
  type?: string;
  category?: string;
  status?: string;
  props?: StoredDocumentProps;
  addedbyid?: string;
  organizationid?: string;
  createdat?: string;
  updatedat?: string;
  putUrl?: string;
}>;

export type InvoiceDocumentCreatePayload = Readonly<{
  name: string;
  size: number;
  type?: string;
  props?: StoredDocumentProps;
}>;
