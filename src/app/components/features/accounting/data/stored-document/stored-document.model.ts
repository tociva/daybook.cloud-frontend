import type { Lb4Include, Lb4ListQuery } from '../../../../../shared/crud';

export enum DocumentStatus {
  INITIATED = 'INITIATED',
  UPLOADED = 'UPLOADED',
}

export enum DocumentCategory {
  ORGANIZATION_LEVEL_DOCUMENT = 'ORGANIZATION_LEVEL_DOCUMENT',
  ORGANIZATION_LOGO = 'ORGANIZATION_LOGO',
  BRANCH_LEVEL_DOCUMENT = 'BRANCH_LEVEL_DOCUMENT',
  USER_LEVEL_DOCUMENT = 'USER_LEVEL_DOCUMENT',
  FISCAL_YEAR_LEVEL_DOCUMENT = 'FISCAL_YEAR_LEVEL_DOCUMENT',
  INVOICE_DOCUMENT = 'INVOICE_DOCUMENT',
  RECEIPT_DOCUMENT = 'RECEIPT_DOCUMENT',
  JOURNAL_SUPPORTING_DOCUMENT = 'JOURNAL_SUPPORTING_DOCUMENT',
  GST_RECONCILIATION_FILE = 'GST_RECONCILIATION_FILE',
  EMPLOYEE_DOCUMENT = 'EMPLOYEE_DOCUMENT',
  OTHER_DOCUMENT = 'OTHER_DOCUMENT',
}

export type DocumentStatusTone = 'neutral' | 'success' | 'warning';

const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  [DocumentCategory.ORGANIZATION_LEVEL_DOCUMENT]: 'Organization Level Document',
  [DocumentCategory.ORGANIZATION_LOGO]: 'Organization Logo',
  [DocumentCategory.BRANCH_LEVEL_DOCUMENT]: 'Branch Level Document',
  [DocumentCategory.USER_LEVEL_DOCUMENT]: 'User Level Document',
  [DocumentCategory.FISCAL_YEAR_LEVEL_DOCUMENT]: 'Fiscal Year Level Document',
  [DocumentCategory.INVOICE_DOCUMENT]: 'Invoice Document',
  [DocumentCategory.RECEIPT_DOCUMENT]: 'Receipt Document',
  [DocumentCategory.JOURNAL_SUPPORTING_DOCUMENT]: 'Journal Supporting Document',
  [DocumentCategory.GST_RECONCILIATION_FILE]: 'GST Reconciliation File',
  [DocumentCategory.EMPLOYEE_DOCUMENT]: 'Employee Document',
  [DocumentCategory.OTHER_DOCUMENT]: 'Other Document',
};

const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  [DocumentStatus.INITIATED]: 'Initiated',
  [DocumentStatus.UPLOADED]: 'Uploaded',
};

export function documentCategoryLabel(value: string | null | undefined): string {
  if (!value) return '—';
  return DOCUMENT_CATEGORY_LABELS[value as DocumentCategory] ?? titleCaseEnumValue(value);
}

export function documentStatusLabel(value: string | null | undefined): string {
  if (!value) return '—';
  return DOCUMENT_STATUS_LABELS[value as DocumentStatus] ?? titleCaseEnumValue(value);
}

export function documentStatusTone(value: string | null | undefined): DocumentStatusTone {
  switch (value) {
    case DocumentStatus.INITIATED:
      return 'warning';
    case DocumentStatus.UPLOADED:
      return 'success';
    default:
      return 'neutral';
  }
}

function titleCaseEnumValue(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export type StoredDocumentAddedBy = Readonly<{
  id?: string;
  name?: string;
  displayname?: string;
  displayName?: string;
  username?: string;
}>;

export type StoredDocument = Readonly<{
  createdat?: string;
  createdby?: string;
  updatedat?: string;
  updatedby?: string;
  id?: string;
  name: string;
  path: string;
  size: number;
  type?: string;
  category: string;
  status?: DocumentStatus | string;
  props?: Record<string, unknown>;
  addedby?: StoredDocumentAddedBy;
  addedbyid: string;
  organizationid: string;
  putUrl?: string;
}>;

/**
 * Mirrors API schema "New Document". Keep optional fields permissive
 * because server-generated values may vary by endpoint configuration.
 */
export type StoredDocumentCreatePayload = Readonly<{
  name: string;
  path?: string;
  size: number;
  type?: string;
  props?: Record<string, unknown>;
}>;

/** PATCH /storage/stored-document/{id} accepts only name in current spec. */
export type StoredDocumentUpdatePayload = Readonly<{
  name: string;
}>;

export type StoredDocumentListQuery = Lb4ListQuery;

export type StoredDocumentGetQuery = Readonly<{
  includes?: readonly Lb4Include[];
}>;

export type StoredDocumentValidateUploadS3Result = Readonly<{
  validatedat: string;
  exists: boolean;
  completed: boolean;
  contentLength?: number;
  eTag?: string;
  lastModified?: string;
  contentType?: string;
  metadata?: Record<string, string>;
  sizeMatches?: boolean;
  expectedSize?: number;
  actualSize?: number;
  error?: string;
}>;

export type StoredDocumentValidateUploadDocument = Readonly<{
  id: string;
  name: string;
  category: string;
  path: string;
  previousStatus: DocumentStatus.INITIATED;
  status: DocumentStatus.INITIATED | DocumentStatus.UPLOADED;
  action: 'uploaded' | 'missing' | 'sizeMismatch' | 'failed';
  s3?: StoredDocumentValidateUploadS3Result;
  error?: string;
}>;

export type StoredDocumentValidateUploadResponse = Readonly<{
  scanned: number;
  uploaded: number;
  missing: number;
  sizeMismatch: number;
  failed: number;
  documents: readonly StoredDocumentValidateUploadDocument[];
}>;
