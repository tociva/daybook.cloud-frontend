export type ApiErrorParams = Record<string, unknown>;

export type ApiErrorDetailPath = string | readonly (number | string)[];

export interface ApiErrorDetail {
  code?: string;
  field?: string;
  message?: string;
  messageKey?: string;
  params?: ApiErrorParams;
  path?: ApiErrorDetailPath;
  property?: string;
  value?: unknown;
  [key: string]: unknown;
}

export interface ApiErrorBody {
  statusCode: number;
  code?: string;
  message?: string;
  messageKey?: string;
  params?: ApiErrorParams;
  requestId?: string;
  timestamp?: string;
  path?: string;
  method?: string;
  locale?: string;
  details?: ApiErrorDetail[];
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorBody;
}

export interface NormalizedApiError {
  statusCode: number;
  code?: string;
  message: string;
  messageKey?: string;
  params?: ApiErrorParams;
  requestId?: string;
  timestamp?: string;
  path?: string;
  method?: string;
  locale?: string;
  details?: ApiErrorDetail[];
  raw?: unknown;
}

export class ApiError extends Error implements NormalizedApiError {
  override readonly name = 'ApiError';
  readonly statusCode: number;
  readonly code?: string;
  readonly messageKey?: string;
  readonly params?: ApiErrorParams;
  readonly requestId?: string;
  readonly timestamp?: string;
  readonly path?: string;
  readonly method?: string;
  readonly locale?: string;
  readonly details?: ApiErrorDetail[];
  readonly raw?: unknown;

  constructor(error: NormalizedApiError) {
    super(error.message);
    this.statusCode = error.statusCode;
    this.code = error.code;
    this.messageKey = error.messageKey;
    this.params = error.params;
    this.requestId = error.requestId;
    this.timestamp = error.timestamp;
    this.path = error.path;
    this.method = error.method;
    this.locale = error.locale;
    this.details = error.details;
    this.raw = error.raw;
  }
}
