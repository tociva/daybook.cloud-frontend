import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ApiErrorResponse } from './api-error.model';
import { getApiErrorFieldMessage, normalizeApiError } from './api-error.util';

function createHttpError(
  status: number,
  error: unknown,
  headers: Record<string, string> = {},
): HttpErrorResponse {
  return new HttpErrorResponse({
    error,
    headers: new HttpHeaders(headers),
    status,
    statusText: 'Error',
    url: 'https://api.daybook.test/inventory/sale-invoice',
  });
}

function createEnvelope(
  statusCode: number,
  overrides: Partial<ApiErrorResponse['error']> = {},
): ApiErrorResponse {
  return {
    success: false,
    error: {
      statusCode,
      code: 'UNPROCESSABLE_ENTITY',
      message: 'Validation failed.',
      requestId: 'req-body',
      timestamp: '2026-05-22T10:00:00.000Z',
      path: '/inventory/sale-invoice',
      method: 'POST',
      locale: 'en',
      details: [],
      ...overrides,
    },
  };
}

describe('normalizeApiError', () => {
  it('normalizes the standard backend error envelope', () => {
    const normalized = normalizeApiError(
      createHttpError(
        422,
        createEnvelope(422, {
          code: 'RESOURCE_ALREADY_EXISTS',
          message: 'Sale invoice number already exists.',
          messageKey: 'errors.validation.failed',
          params: { invoiceNumber: 'SI-001' },
        }),
      ),
    );

    expect(normalized.statusCode).toBe(422);
    expect(normalized.code).toBe('RESOURCE_ALREADY_EXISTS');
    expect(normalized.message).toBe('Sale invoice number already exists.');
    expect(normalized.messageKey).toBe('errors.validation.failed');
    expect(normalized.params).toEqual({ invoiceNumber: 'SI-001' });
    expect(normalized.requestId).toBe('req-body');
    expect(normalized.timestamp).toBe('2026-05-22T10:00:00.000Z');
    expect(normalized.path).toBe('/inventory/sale-invoice');
    expect(normalized.method).toBe('POST');
    expect(normalized.locale).toBe('en');
  });

  it('uses messageKey translations with params and preserves validation details', () => {
    const normalized = normalizeApiError(
      createHttpError(
        422,
        createEnvelope(422, {
          message: 'Name is required.',
          messageKey: 'errors.field.required',
          params: { field: 'Name' },
          details: [{ path: 'name', code: 'required', message: 'Name is required.' }],
        }),
      ),
      {
        translate: (messageKey, params) =>
          messageKey === 'errors.field.required' ? `Please enter ${params?.['field']}.` : null,
      },
    );

    expect(normalized.message).toBe('Please enter Name.');
    expect(normalized.details).toEqual([
      { path: 'name', code: 'required', message: 'Name is required.' },
    ]);
    expect(getApiErrorFieldMessage(normalized, 'name')).toBe('Name is required.');
  });

  it('normalizes 401 authentication failures', () => {
    const normalized = normalizeApiError(
      createHttpError(
        401,
        createEnvelope(401, {
          code: 'AUTHENTICATION_FAILED',
          message: 'Authentication failed.',
        }),
      ),
    );

    expect(normalized.statusCode).toBe(401);
    expect(normalized.code).toBe('AUTHENTICATION_FAILED');
    expect(normalized.message).toBe('Authentication failed.');
  });

  it('normalizes 403 permission failures', () => {
    const normalized = normalizeApiError(
      createHttpError(
        403,
        createEnvelope(403, {
          code: 'ACCESS_DENIED',
          message: 'You do not have permission to perform this action.',
        }),
      ),
    );

    expect(normalized.statusCode).toBe(403);
    expect(normalized.code).toBe('ACCESS_DENIED');
    expect(normalized.message).toBe('You do not have permission to perform this action.');
  });

  it('normalizes 404 not found failures', () => {
    const normalized = normalizeApiError(
      createHttpError(
        404,
        createEnvelope(404, {
          code: 'RESOURCE_NOT_FOUND',
          message: 'The requested resource was not found.',
        }),
      ),
    );

    expect(normalized.statusCode).toBe(404);
    expect(normalized.code).toBe('RESOURCE_NOT_FOUND');
    expect(normalized.message).toBe('The requested resource was not found.');
  });

  it('normalizes 422 duplicate resource failures', () => {
    const normalized = normalizeApiError(
      createHttpError(
        422,
        createEnvelope(422, {
          code: 'RESOURCE_ALREADY_EXISTS',
          message: 'Tax group name already exists.',
        }),
      ),
    );

    expect(normalized.statusCode).toBe(422);
    expect(normalized.code).toBe('RESOURCE_ALREADY_EXISTS');
    expect(normalized.message).toBe('Tax group name already exists.');
  });

  it('uses a generic message for 500 failures and keeps the request id for support', () => {
    const normalized = normalizeApiError(
      createHttpError(
        500,
        createEnvelope(500, {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'database constraint details should not render',
          requestId: undefined,
        }),
        { 'x-request-id': 'req-header-500' },
      ),
    );

    expect(normalized.statusCode).toBe(500);
    expect(normalized.message).toBe(
      'Something went wrong. Please try again later. Reference: req-header-500.',
    );
    expect(normalized.message).not.toContain('database constraint');
    expect(normalized.requestId).toBe('req-header-500');
  });

  it('falls back by HTTP status for malformed non-standard error responses', () => {
    const normalized = normalizeApiError(
      createHttpError(
        400,
        {
          message: { message: 'Old nested message should not render.' },
          detail: 'Old detail should not render.',
        },
        { 'content-language': 'en-US' },
      ),
    );

    expect(normalized.statusCode).toBe(400);
    expect(normalized.locale).toBe('en-US');
    expect(normalized.message).toBe('The request could not be processed.');
    expect(normalized.message).not.toContain('Old nested');
    expect(normalized.message).not.toContain('Old detail');
  });
});
