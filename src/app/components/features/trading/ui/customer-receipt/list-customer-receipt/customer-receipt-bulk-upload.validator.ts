import type { BulkUploadPayload } from '../../../../../../shared/bulk-upload/bulk-upload-preview-config';

const ROOT_KEY = 'receipts';
const MAX_ERRORS = 100;

const RECEIPT_KEYS = new Set([
  'number',
  'date',
  'amount',
  'customername',
  'bcashname',
  'currencycode',
  'description',
  'invoices',
]);

const ALLOCATION_KEYS = new Set(['saleinvoicenumber', 'amount']);

export function validateCustomerReceiptBulkUploadPayload(
  payload: BulkUploadPayload,
): readonly string[] {
  const errors: string[] = [];

  const pushError = (message: string): void => {
    if (errors.length < MAX_ERRORS) {
      errors.push(message);
    }
  };

  if (!isRecord(payload)) {
    return ['Bulk upload JSON root must be an object.'];
  }

  const rootKeys = Object.keys(payload);
  if (rootKeys.length !== 1 || rootKeys[0] !== ROOT_KEY) {
    pushError(`Bulk upload JSON root must contain only "${ROOT_KEY}".`);
    return errors;
  }

  const receipts = payload[ROOT_KEY];
  if (!Array.isArray(receipts)) {
    pushError(`"${ROOT_KEY}" must be an array.`);
    return errors;
  }

  if (!receipts.length) {
    pushError(`"${ROOT_KEY}" must contain at least one record.`);
    return errors;
  }

  for (const [index, receipt] of receipts.entries()) {
    if (errors.length >= MAX_ERRORS) break;

    if (!isRecord(receipt)) {
      pushError(receiptError(index, undefined, 'must be an object.'));
      continue;
    }

    const number = readNonEmptyString(receipt['number']);

    pushUnknownKeyErrors(receipt, RECEIPT_KEYS, (message) =>
      pushError(receiptError(index, number ?? undefined, message)),
    );

    validateOptionalNonEmptyString(receipt, 'number', index, number, pushError);
    validateIsoDate(receipt['date'], 'date', index, number, pushError);
    validateRequiredNumber(receipt, 'amount', index, number, pushError);
    validateRequiredNonEmptyString(receipt, 'customername', index, number, pushError);
    validateRequiredNonEmptyString(receipt, 'bcashname', index, number, pushError);
    validateOptionalNonEmptyString(receipt, 'currencycode', index, number, pushError);
    validateOptionalString(receipt, 'description', index, number, pushError);

    if (!Object.prototype.hasOwnProperty.call(receipt, 'invoices')) {
      pushError(receiptError(index, number ?? undefined, 'invoices is required and must be an array.'));
      continue;
    }

    const invoices = receipt['invoices'];
    if (!Array.isArray(invoices)) {
      pushError(receiptError(index, number ?? undefined, 'invoices must be an array.'));
      continue;
    }

    for (const [allocationIndex, allocation] of invoices.entries()) {
      if (errors.length >= MAX_ERRORS) break;
      validateAllocation(allocation, index, number, allocationIndex, pushError);
    }
  }

  return errors;
}

function validateAllocation(
  value: unknown,
  receiptIndex: number,
  receiptNumber: string | null,
  allocationIndex: number,
  pushError: (message: string) => void,
): void {
  if (!isRecord(value)) {
    pushError(allocationError(receiptIndex, receiptNumber, allocationIndex, 'must be an object.'));
    return;
  }

  pushUnknownKeyErrors(value, ALLOCATION_KEYS, (message) =>
    pushError(allocationError(receiptIndex, receiptNumber, allocationIndex, message)),
  );

  if (!readNonEmptyString(value['saleinvoicenumber'])) {
    pushError(
      allocationError(
        receiptIndex,
        receiptNumber,
        allocationIndex,
        'saleinvoicenumber is required and must be a non-empty string.',
      ),
    );
  }

  if (readNumber(value['amount']) === null) {
    pushError(
      allocationError(
        receiptIndex,
        receiptNumber,
        allocationIndex,
        'amount is required and must be a number.',
      ),
    );
  }
}

function validateIsoDate(
  value: unknown,
  fieldName: string,
  receiptIndex: number,
  receiptNumber: string | null,
  pushError: (message: string) => void,
): void {
  if (typeof value !== 'string' || !isIsoDateString(value)) {
    pushError(
      receiptError(
        receiptIndex,
        receiptNumber ?? undefined,
        `${fieldName} must be formatted as YYYY-MM-DD.`,
      ),
    );
  }
}

function validateRequiredNonEmptyString(
  row: Record<string, unknown>,
  fieldName: string,
  receiptIndex: number,
  receiptNumber: string | null,
  pushError: (message: string) => void,
): void {
  if (!readNonEmptyString(row[fieldName])) {
    pushError(
      receiptError(
        receiptIndex,
        receiptNumber ?? undefined,
        `${fieldName} is required and must be a non-empty string.`,
      ),
    );
  }
}

function validateOptionalNonEmptyString(
  row: Record<string, unknown>,
  fieldName: string,
  receiptIndex: number,
  receiptNumber: string | null,
  pushError: (message: string) => void,
): void {
  if (!(fieldName in row) || row[fieldName] === undefined || row[fieldName] === null) return;

  if (!readNonEmptyString(row[fieldName])) {
    pushError(
      receiptError(
        receiptIndex,
        receiptNumber ?? undefined,
        `${fieldName} must be a non-empty string.`,
      ),
    );
  }
}

function validateOptionalString(
  row: Record<string, unknown>,
  fieldName: string,
  receiptIndex: number,
  receiptNumber: string | null,
  pushError: (message: string) => void,
): void {
  if (!(fieldName in row) || row[fieldName] === undefined || row[fieldName] === null) return;

  if (typeof row[fieldName] !== 'string') {
    pushError(
      receiptError(receiptIndex, receiptNumber ?? undefined, `${fieldName} must be a string.`),
    );
  }
}

function validateRequiredNumber(
  row: Record<string, unknown>,
  fieldName: string,
  receiptIndex: number,
  receiptNumber: string | null,
  pushError: (message: string) => void,
): void {
  if (readNumber(row[fieldName]) === null) {
    pushError(
      receiptError(
        receiptIndex,
        receiptNumber ?? undefined,
        `${fieldName} is required and must be a number.`,
      ),
    );
  }
}

function pushUnknownKeyErrors(
  row: Record<string, unknown>,
  allowedKeys: ReadonlySet<string>,
  pushError: (message: string) => void,
): void {
  for (const key of Object.keys(row)) {
    if (!allowedKeys.has(key)) {
      pushError(`unknown field "${key}".`);
    }
  }
}

function receiptError(index: number, number: string | undefined, message: string): string {
  const label = number?.trim() || '-';
  return `Receipt ${index + 1} (${label}): ${message}`;
}

function allocationError(
  receiptIndex: number,
  receiptNumber: string | null,
  allocationIndex: number,
  message: string,
): string {
  const receiptLabel = receiptNumber?.trim() || '-';
  return `Receipt ${receiptIndex + 1} (${receiptLabel}), allocation ${
    allocationIndex + 1
  }: ${message}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function isIsoDateString(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}
