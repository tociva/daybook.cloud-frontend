import { Action } from "@ngrx/store";
import { DbcError } from "../../util/types/dbc-error.type";

export interface HttpRequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  params?: Record<string, any>;
}

export interface HttpRequestMetadata<T = unknown> {
  requestId: string;
  actionName: string;
  successMessage?: string;
  errorMessage?: string;
  onSuccessAction?: (data: T) => Action;
  onErrorAction?: (error: DbcError) => Action;
}