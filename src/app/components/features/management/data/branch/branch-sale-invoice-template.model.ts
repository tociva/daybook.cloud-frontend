export type SaleInvoiceTemplateType = 'no-tax' | 'one-tax' | 'two-tax';

export type SaleInvoiceTemplateUploadUrlPayload = Readonly<{
  name: string;
  size: number;
}>;

export type SaleInvoiceTemplateDocumentProps = Readonly<{
  branchid?: string;
  documentKind?: string;
  templateType?: SaleInvoiceTemplateType;
}>;

export type SaleInvoiceTemplateDocument = Readonly<{
  id?: string;
  name: string;
  path?: string;
  size: number;
  type?: string;
  category?: string;
  status?: string;
  organizationid?: string;
  props?: SaleInvoiceTemplateDocumentProps;
  putUrl?: string;
}>;

export type SaleInvoiceTemplateUploadUrlResponse = SaleInvoiceTemplateDocument &
  Readonly<{
    templateType: SaleInvoiceTemplateType;
    putUrl: string;
  }>;

export type SaleInvoiceTemplateMetadata = Readonly<{
  templateType: SaleInvoiceTemplateType;
  path: string;
  source: 'storedDocument' | 'default' | string;
  document?: SaleInvoiceTemplateDocument;
}>;
