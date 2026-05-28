import type { Lb4Include, Lb4ListQuery } from '../../../../../shared/crud';

export enum DocumentStatus {
  INITIATED = 'INITIATED',
  UPLOADED = 'UPLOADED',
}

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
  category?: string;
  status?: DocumentStatus | string;
  props?: Record<string, unknown>;
  addedbyid?: string;
  organizationid?: string;
}>;

/** PATCH /storage/stored-document/{id} accepts only name in current spec. */
export type StoredDocumentUpdatePayload = Readonly<{
  name: string;
}>;

export type StoredDocumentListQuery = Lb4ListQuery;

export type StoredDocumentGetQuery = Readonly<{
  includes?: readonly Lb4Include[];
}>;

export type StoredDocumentWritePayload = Readonly<
  {
    name: string;
  } & Partial<Omit<StoredDocumentCreatePayload, 'name'>>
>;
