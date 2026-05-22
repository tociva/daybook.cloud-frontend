import { HttpErrorResponse } from '@angular/common/http';
import {
  ApiError,
  ApiErrorBody,
  ApiErrorDetail,
  ApiErrorParams,
  ApiErrorResponse,
} from './api-error.model';

export type ApiErrorTranslator = (
  messageKey: string,
  params?: ApiErrorParams,
  locale?: string,
) => string | null | undefined;

export type ApiErrorNormalizationOptions = Readonly<{
  fallbackMessage?: string;
  translate?: ApiErrorTranslator;
}>;

const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.';
const GENERIC_SERVER_ERROR_MESSAGE = 'Something went wrong. Please try again later.';

const STATUS_MESSAGES: Record<number, string> = {
  0: 'Unable to reach the server. Check your connection and try again.',
  400: 'The request could not be processed.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'This action conflicts with existing data.',
  422: 'Please review the highlighted fields and try again.',
};

export function normalizeApiError(
  error: unknown,
  options: ApiErrorNormalizationOptions = {},
): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof HttpErrorResponse) {
    return normalizeHttpErrorResponse(error, options);
  }

  if (isApiErrorResponse(error)) {
    return normalizeApiErrorEnvelope(error, undefined, options, error);
  }

  if (error instanceof Error) {
    return new ApiError({
      message: error.message || options.fallbackMessage || DEFAULT_ERROR_MESSAGE,
      raw: error,
      statusCode: 0,
    });
  }

  return new ApiError({
    message: options.fallbackMessage || DEFAULT_ERROR_MESSAGE,
    raw: error,
    statusCode: 0,
  });
}

export function getApiErrorMessage(error: unknown, fallbackMessage: string): string {
  return normalizeApiError(error, { fallbackMessage }).message;
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isApiErrorStatus(error: unknown, statusCode: number): boolean {
  return normalizeApiError(error).statusCode === statusCode;
}

export function getApiErrorFieldMessage(error: unknown, field: string): string | null {
  const normalized = normalizeApiError(error);
  const detail = normalized.details?.find((entry) => normalizeDetailPath(entry) === field);
  return detail?.message ?? null;
}

export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (!isRecord(value) || value['success'] !== false) {
    return false;
  }

  const error = value['error'];
  return isRecord(error);
}

export function interpolateApiErrorMessage(template: string, params?: ApiErrorParams): string {
  if (!params) {
    return template;
  }

  return template.replace(
    /\{\{\s*([\w.-]+)\s*\}\}|\{\s*([\w.-]+)\s*\}/g,
    (_match, doubleBraceKey: string | undefined, singleBraceKey: string | undefined) => {
      const key = doubleBraceKey ?? singleBraceKey;
      if (!key) {
        return '';
      }

      const value = params[key];
      return value === null || value === undefined ? '' : String(value);
    },
  );
}

function normalizeHttpErrorResponse(
  response: HttpErrorResponse,
  options: ApiErrorNormalizationOptions,
): ApiError {
  const requestId = normalizeOptionalString(response.headers.get('x-request-id'));
  const contentLanguage = normalizeOptionalString(response.headers.get('content-language'));

  if (isApiErrorResponse(response.error)) {
    return normalizeApiErrorEnvelope(
      response.error,
      {
        contentLanguage,
        requestId,
        statusCode: response.status,
      },
      options,
      response,
    );
  }

  const statusCode = normalizeStatusCode(response.status);
  return new ApiError({
    locale: contentLanguage,
    message: resolveFallbackMessage(statusCode, requestId, options.fallbackMessage),
    raw: response,
    requestId,
    statusCode,
  });
}

function normalizeApiErrorEnvelope(
  response: ApiErrorResponse,
  httpMetadata:
    | Readonly<{
        contentLanguage?: string;
        requestId?: string;
        statusCode?: number;
      }>
    | undefined,
  options: ApiErrorNormalizationOptions,
  raw: unknown,
): ApiError {
  const body = normalizeApiErrorBody(response.error);
  const statusCode = normalizeStatusCode(body.statusCode || httpMetadata?.statusCode);
  const requestId = body.requestId ?? httpMetadata?.requestId;
  const locale = body.locale ?? httpMetadata?.contentLanguage;
  const message = resolveDisplayMessage(body, statusCode, requestId, locale, options);

  return new ApiError({
    code: body.code,
    details: body.details,
    locale,
    message,
    messageKey: body.messageKey,
    method: body.method,
    params: body.params,
    path: body.path,
    raw,
    requestId,
    statusCode,
    timestamp: body.timestamp,
  });
}

function normalizeApiErrorBody(value: unknown): ApiErrorBody {
  if (!isRecord(value)) {
    return { statusCode: 0 };
  }

  return {
    statusCode: normalizeStatusCode(value['statusCode']),
    ...(normalizeOptionalString(value['code']) && { code: normalizeOptionalString(value['code']) }),
    ...(normalizeOptionalString(value['message']) && {
      message: normalizeOptionalString(value['message']),
    }),
    ...(normalizeOptionalString(value['messageKey']) && {
      messageKey: normalizeOptionalString(value['messageKey']),
    }),
    ...(normalizeParams(value['params']) && { params: normalizeParams(value['params']) }),
    ...(normalizeOptionalString(value['requestId']) && {
      requestId: normalizeOptionalString(value['requestId']),
    }),
    ...(normalizeOptionalString(value['timestamp']) && {
      timestamp: normalizeOptionalString(value['timestamp']),
    }),
    ...(normalizeOptionalString(value['path']) && { path: normalizeOptionalString(value['path']) }),
    ...(normalizeOptionalString(value['method']) && {
      method: normalizeOptionalString(value['method']),
    }),
    ...(normalizeOptionalString(value['locale']) && {
      locale: normalizeOptionalString(value['locale']),
    }),
    ...(normalizeDetails(value['details']) && { details: normalizeDetails(value['details']) }),
  };
}

function resolveDisplayMessage(
  body: ApiErrorBody,
  statusCode: number,
  requestId: string | undefined,
  locale: string | undefined,
  options: ApiErrorNormalizationOptions,
): string {
  if (statusCode >= 500) {
    return formatServerErrorMessage(requestId);
  }

  const translated =
    body.messageKey && options.translate
      ? options.translate(body.messageKey, body.params, locale)
      : null;

  return (
    normalizeOptionalString(translated) ??
    normalizeOptionalString(body.message) ??
    resolveFallbackMessage(statusCode, requestId, options.fallbackMessage)
  );
}

function resolveFallbackMessage(
  statusCode: number,
  requestId: string | undefined,
  fallbackMessage: string | undefined,
): string {
  if (statusCode >= 500) {
    return formatServerErrorMessage(requestId);
  }

  return STATUS_MESSAGES[statusCode] ?? fallbackMessage ?? DEFAULT_ERROR_MESSAGE;
}

function formatServerErrorMessage(requestId: string | undefined): string {
  return requestId
    ? `${GENERIC_SERVER_ERROR_MESSAGE} Reference: ${requestId}.`
    : GENERIC_SERVER_ERROR_MESSAGE;
}

function normalizeStatusCode(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function normalizeOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function normalizeParams(value: unknown): ApiErrorParams | undefined {
  return isRecord(value) ? value : undefined;
}

function normalizeDetails(value: unknown): ApiErrorDetail[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const details = value.filter(isRecord).map((entry) => ({ ...entry }) as ApiErrorDetail);
  return details.length > 0 ? details : undefined;
}

function normalizeDetailPath(detail: ApiErrorDetail): string | null {
  if (typeof detail.field === 'string') {
    return detail.field;
  }

  if (typeof detail.property === 'string') {
    return detail.property;
  }

  if (typeof detail.path === 'string') {
    return detail.path.replace(/^\//, '').replace(/\//g, '.');
  }

  if (Array.isArray(detail.path)) {
    return detail.path.join('.');
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
