import type { BulkUploadPayload } from '../../../../../../shared/bulk-upload/bulk-upload-preview-config';

const ROOT_KEY = 'payments';
const MAX_ERRORS = 100;

const PAYMENT_KEYS = new Set([
  'date',
  'amount',
  'vendorname',
  'bcashname',
  'currencycode',
  'description',
  'invoices',
]);

const ALLOCATION_KEYS = new Set(['purchaseinvoicenumber', 'amount']);

export function validateVendorPaymentBulkUploadPayload(
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

  const payments = payload[ROOT_KEY];
  if (!Array.isArray(payments)) {
    pushError(`"${ROOT_KEY}" must be an array.`);
    return errors;
  }

  if (!payments.length) {
    pushError(`"${ROOT_KEY}" must contain at least one record.`);
    return errors;
  }

  for (const [index, payment] of payments.entries()) {
    if (errors.length >= MAX_ERRORS) break;

    if (!isRecord(payment)) {
      pushError(paymentError(index, undefined, 'must be an object.'));
      continue;
    }

    const vendorName = readNonEmptyString(payment['vendorname']);

    pushUnknownKeyErrors(payment, PAYMENT_KEYS, (message) =>
      pushError(paymentError(index, vendorName ?? undefined, message)),
    );

    validateIsoDate(payment['date'], 'date', index, vendorName, pushError);
    validateRequiredNonNegativeNumber(payment, 'amount', index, vendorName, pushError);
    validateRequiredNonEmptyString(payment, 'vendorname', index, vendorName, pushError);
    validateRequiredNonEmptyString(payment, 'bcashname', index, vendorName, pushError);
    validateOptionalNonEmptyString(payment, 'currencycode', index, vendorName, pushError);
    validateOptionalString(payment, 'description', index, vendorName, pushError);

    if (!Object.prototype.hasOwnProperty.call(payment, 'invoices')) {
      pushError(
        paymentError(index, vendorName ?? undefined, 'invoices is required and must be an array.'),
      );
      continue;
    }

    const invoices = payment['invoices'];
    if (!Array.isArray(invoices)) {
      pushError(paymentError(index, vendorName ?? undefined, 'invoices must be an array.'));
      continue;
    }

    for (const [allocationIndex, allocation] of invoices.entries()) {
      if (errors.length >= MAX_ERRORS) break;
      validateAllocation(allocation, index, vendorName, allocationIndex, pushError);
    }
  }

  return errors;
}

function validateAllocation(
  value: unknown,
  paymentIndex: number,
  vendorName: string | null,
  allocationIndex: number,
  pushError: (message: string) => void,
): void {
  if (!isRecord(value)) {
    pushError(allocationError(paymentIndex, vendorName, allocationIndex, 'must be an object.'));
    return;
  }

  pushUnknownKeyErrors(value, ALLOCATION_KEYS, (message) =>
    pushError(allocationError(paymentIndex, vendorName, allocationIndex, message)),
  );

  if (!readNonEmptyString(value['purchaseinvoicenumber'])) {
    pushError(
      allocationError(
        paymentIndex,
        vendorName,
        allocationIndex,
        'purchaseinvoicenumber is required and must be a non-empty string.',
      ),
    );
  }

  const amount = readNumber(value['amount']);
  if (amount === null) {
    pushError(
      allocationError(
        paymentIndex,
        vendorName,
        allocationIndex,
        'amount is required and must be a number.',
      ),
    );
  } else if (amount < 0) {
    pushError(
      allocationError(
        paymentIndex,
        vendorName,
        allocationIndex,
        'amount must be greater than or equal to 0.',
      ),
    );
  }
}

function validateIsoDate(
  value: unknown,
  fieldName: string,
  paymentIndex: number,
  vendorName: string | null,
  pushError: (message: string) => void,
): void {
  if (typeof value !== 'string' || !isIsoDateString(value)) {
    pushError(
      paymentError(
        paymentIndex,
        vendorName ?? undefined,
        `${fieldName} must be formatted as YYYY-MM-DD.`,
      ),
    );
  }
}

function validateRequiredNonEmptyString(
  row: Record<string, unknown>,
  fieldName: string,
  paymentIndex: number,
  vendorName: string | null,
  pushError: (message: string) => void,
): void {
  if (!readNonEmptyString(row[fieldName])) {
    pushError(
      paymentError(
        paymentIndex,
        vendorName ?? undefined,
        `${fieldName} is required and must be a non-empty string.`,
      ),
    );
  }
}

function validateOptionalNonEmptyString(
  row: Record<string, unknown>,
  fieldName: string,
  paymentIndex: number,
  vendorName: string | null,
  pushError: (message: string) => void,
): void {
  if (!(fieldName in row) || row[fieldName] === undefined || row[fieldName] === null) return;

  if (!readNonEmptyString(row[fieldName])) {
    pushError(
      paymentError(
        paymentIndex,
        vendorName ?? undefined,
        `${fieldName} must be a non-empty string.`,
      ),
    );
  }
}

function validateOptionalString(
  row: Record<string, unknown>,
  fieldName: string,
  paymentIndex: number,
  vendorName: string | null,
  pushError: (message: string) => void,
): void {
  if (!(fieldName in row) || row[fieldName] === undefined || row[fieldName] === null) return;

  if (typeof row[fieldName] !== 'string') {
    pushError(
      paymentError(paymentIndex, vendorName ?? undefined, `${fieldName} must be a string.`),
    );
  }
}

function validateRequiredNonNegativeNumber(
  row: Record<string, unknown>,
  fieldName: string,
  paymentIndex: number,
  vendorName: string | null,
  pushError: (message: string) => void,
): void {
  const amount = readNumber(row[fieldName]);
  if (amount === null) {
    pushError(
      paymentError(
        paymentIndex,
        vendorName ?? undefined,
        `${fieldName} is required and must be a number.`,
      ),
    );
  } else if (amount < 0) {
    pushError(
      paymentError(
        paymentIndex,
        vendorName ?? undefined,
        `${fieldName} must be greater than or equal to 0.`,
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

function paymentError(index: number, vendorName: string | undefined, message: string): string {
  const label = vendorName?.trim() || '-';
  return `Payment ${index + 1} (${label}): ${message}`;
}

function allocationError(
  paymentIndex: number,
  vendorName: string | null,
  allocationIndex: number,
  message: string,
): string {
  const paymentLabel = vendorName?.trim() || '-';
  return `Payment ${paymentIndex + 1} (${paymentLabel}), allocation ${
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
