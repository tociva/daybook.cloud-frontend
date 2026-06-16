import type { BulkUploadPayload } from '../../../../../../shared/bulk-upload/bulk-upload-preview-config';

export type SaleInvoiceBulkUploadValidationOptions = Readonly<{
  minorUnit?: number;
}>;

const ROOT_KEY = 'invoices';
const MAX_ERRORS = 100;
const DEFAULT_MINOR_UNIT = 2;

const INVOICE_KEYS = new Set([
  'number',
  'date',
  'duedate',
  'customername',
  'currencycode',
  'description',
  'taxoption',
  'deliverystate',
  'billingaddress',
  'shippingaddress',
  'itemtotal',
  'discount',
  'subtotal',
  'tax',
  'roundoff',
  'grandtotal',
  'items',
]);

const ADDRESS_KEYS = new Set([
  'name',
  'line1',
  'line2',
  'street',
  'city',
  'state',
  'zip',
  'country',
  'mobile',
  'email',
]);

const ADDRESS_REQUIRED_KEYS = [
  'name',
  'line1',
  'street',
  'city',
  'state',
  'zip',
  'country',
] as const;

const ITEM_KEYS = new Set([
  'name',
  'displayname',
  'description',
  'order',
  'code',
  'price',
  'quantity',
  'itemtotal',
  'discpercent',
  'discamount',
  'subtotal',
  'taxamount',
  'grandtotal',
  'taxes',
]);

const TAX_KEYS = new Set(['name', 'shortname', 'rate', 'appliedto', 'amount']);

const INVOICE_AMOUNT_KEYS = [
  'itemtotal',
  'discount',
  'subtotal',
  'tax',
  'roundoff',
  'grandtotal',
] as const;

const ITEM_AMOUNT_KEYS = [
  'price',
  'itemtotal',
  'discpercent',
  'discamount',
  'subtotal',
  'taxamount',
  'grandtotal',
] as const;

export function validateSaleInvoiceBulkUploadPayload(
  payload: BulkUploadPayload,
  options: SaleInvoiceBulkUploadValidationOptions = {},
): readonly string[] {
  const minorUnit = options.minorUnit ?? DEFAULT_MINOR_UNIT;
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

  const invoices = payload[ROOT_KEY];
  if (!Array.isArray(invoices)) {
    pushError(`"${ROOT_KEY}" must be an array.`);
    return errors;
  }

  if (!invoices.length) {
    pushError(`"${ROOT_KEY}" must contain at least one record.`);
    return errors;
  }

  const seenNumbers = new Map<string, number>();

  for (const [index, invoice] of invoices.entries()) {
    if (errors.length >= MAX_ERRORS) break;

    if (!isRecord(invoice)) {
      pushError(invoiceError(index, undefined, 'must be an object.'));
      continue;
    }

    const number = readNonEmptyString(invoice['number']);
    const invoiceLabel = invoiceError(index, number ?? undefined, '');

    pushUnknownKeyErrors(invoice, INVOICE_KEYS, (message) =>
      pushError(invoiceError(index, number ?? undefined, message)),
    );

    if (!number) {
      pushError(invoiceError(index, undefined, 'number is required and must be a non-empty string.'));
    } else {
      const normalizedNumber = number.trim();
      const previousIndex = seenNumbers.get(normalizedNumber.toLowerCase());
      if (previousIndex !== undefined) {
        pushError(
          invoiceError(
            index,
            number,
            `duplicate invoice number (also used by invoice ${previousIndex + 1}).`,
          ),
        );
      } else {
        seenNumbers.set(normalizedNumber.toLowerCase(), index);
      }
    }

    validateIsoDate(invoice['date'], 'date', index, number, pushError);
    validateIsoDate(invoice['duedate'], 'duedate', index, number, pushError);

    if (!readNonEmptyString(invoice['customername'])) {
      pushError(
        invoiceError(index, number ?? undefined, 'customername is required and must be a non-empty string.'),
      );
    }

    validateOptionalString(invoice, 'currencycode', index, number, pushError);
    validateOptionalString(invoice, 'description', index, number, pushError);
    validateOptionalString(invoice, 'taxoption', index, number, pushError);
    validateOptionalString(invoice, 'deliverystate', index, number, pushError);

    validateOptionalNonNegativeNumber(invoice, 'discount', index, number, pushError);
    validateOptionalNonNegativeNumber(invoice, 'tax', index, number, pushError);
    validateOptionalNumber(invoice, 'roundoff', index, number, pushError);

    const itemtotal = validateRequiredNonNegativeNumber(
      invoice,
      'itemtotal',
      index,
      number,
      pushError,
    );
    const subtotal = validateRequiredNonNegativeNumber(
      invoice,
      'subtotal',
      index,
      number,
      pushError,
    );
    const grandtotal = validateRequiredNonNegativeNumber(
      invoice,
      'grandtotal',
      index,
      number,
      pushError,
    );

    for (const key of INVOICE_AMOUNT_KEYS) {
      validateAmountPrecision(invoice[key], key, index, number, minorUnit, pushError);
    }

    if ('billingaddress' in invoice && invoice['billingaddress'] !== undefined) {
      validateAddress(invoice['billingaddress'], 'billingaddress', index, number, pushError);
    }

    if ('shippingaddress' in invoice && invoice['shippingaddress'] !== undefined) {
      validateAddress(invoice['shippingaddress'], 'shippingaddress', index, number, pushError);
    }

    const items = invoice['items'];
    if (!Array.isArray(items) || !items.length) {
      pushError(invoiceError(index, number ?? undefined, 'items must contain at least one item.'));
      continue;
    }

    const seenItems = new Set<string>();
    let sumItemTotal = 0;
    let sumSubtotal = 0;
    let sumTaxAmount = 0;
    let sumGrandTotal = 0;

    for (const [itemIndex, item] of items.entries()) {
      if (errors.length >= MAX_ERRORS) break;

      if (!isRecord(item)) {
        pushError(itemError(index, number, itemIndex, undefined, 'must be an object.'));
        continue;
      }

      const itemName = readNonEmptyString(item['name']);
      const displayName = readNonEmptyString(item['displayname']);

      pushUnknownKeyErrors(item, ITEM_KEYS, (message) =>
        pushError(itemError(index, number, itemIndex, itemName ?? undefined, message)),
      );

      if (!itemName) {
        pushError(itemError(index, number, itemIndex, undefined, 'name is required and must be a non-empty string.'));
      }

      if (!displayName) {
        pushError(
          itemError(
            index,
            number,
            itemIndex,
            itemName ?? undefined,
            'displayname is required and must be a non-empty string.',
          ),
        );
      }

      if (!readNonEmptyString(item['code'])) {
        pushError(itemError(index, number, itemIndex, itemName ?? undefined, 'code is required and must be a non-empty string.'));
      }

      const order = validateRequiredNonNegativeNumber(item, 'order', index, number, pushError, {
        itemIndex,
        itemName: itemName ?? undefined,
        integer: false,
      });
      const price = validateRequiredNonNegativeNumber(item, 'price', index, number, pushError, {
        itemIndex,
        itemName: itemName ?? undefined,
      });
      const quantity = validateRequiredNumber(item, 'quantity', index, number, pushError, {
        itemIndex,
        itemName: itemName ?? undefined,
        min: 1,
      });

      const itemItemTotal = validateRequiredNonNegativeNumber(item, 'itemtotal', index, number, pushError, {
        itemIndex,
        itemName: itemName ?? undefined,
      });
      const itemSubtotal = validateRequiredNonNegativeNumber(item, 'subtotal', index, number, pushError, {
        itemIndex,
        itemName: itemName ?? undefined,
      });
      const itemGrandTotal = validateRequiredNonNegativeNumber(item, 'grandtotal', index, number, pushError, {
        itemIndex,
        itemName: itemName ?? undefined,
      });

      validateOptionalString(item, 'description', index, number, pushError, {
        itemIndex,
        itemName: itemName ?? undefined,
      });
      validateOptionalNonNegativeNumber(item, 'discpercent', index, number, pushError, {
        itemIndex,
        itemName: itemName ?? undefined,
      });
      const discamount = validateOptionalNonNegativeNumber(item, 'discamount', index, number, pushError, {
        itemIndex,
        itemName: itemName ?? undefined,
      });
      const taxamount = validateOptionalNonNegativeNumber(item, 'taxamount', index, number, pushError, {
        itemIndex,
        itemName: itemName ?? undefined,
      });

      for (const key of ITEM_AMOUNT_KEYS) {
        validateAmountPrecision(item[key], key, index, number, minorUnit, pushError, {
          itemIndex,
          itemName: itemName ?? undefined,
        });
      }

      if (itemName && displayName) {
        const itemKey = `${itemName.trim().toLowerCase()}::${displayName.trim().toLowerCase()}`;
        if (seenItems.has(itemKey)) {
          pushError(
            itemError(
              index,
              number,
              itemIndex,
              itemName,
              `duplicate item name and display name within this invoice.`,
            ),
          );
        } else {
          seenItems.add(itemKey);
        }
      }

      const taxes = item['taxes'];
      if (taxes !== undefined && taxes !== null) {
        if (!Array.isArray(taxes)) {
          pushError(itemError(index, number, itemIndex, itemName ?? undefined, 'taxes must be an array.'));
        } else if (taxes.length && taxamount === null) {
          pushError(
            itemError(
              index,
              number,
              itemIndex,
              itemName ?? undefined,
              'taxamount is required when taxes are present.',
            ),
          );
        } else {
          for (const [taxIndex, tax] of taxes.entries()) {
            if (errors.length >= MAX_ERRORS) break;
            validateTax(tax, index, number, itemIndex, itemName, taxIndex, minorUnit, pushError);
          }
        }
      }

      if (
        price !== null &&
        quantity !== null &&
        itemItemTotal !== null &&
        !amountsEqual(itemItemTotal, price * quantity, minorUnit)
      ) {
        pushError(
          itemError(
            index,
            number,
            itemIndex,
            itemName ?? undefined,
            'itemtotal must equal price * quantity.',
          ),
        );
      }

      const effectiveDiscamount = discamount ?? 0;
      if (
        itemItemTotal !== null &&
        itemSubtotal !== null &&
        !amountsEqual(itemSubtotal, itemItemTotal - effectiveDiscamount, minorUnit)
      ) {
        pushError(
          itemError(
            index,
            number,
            itemIndex,
            itemName ?? undefined,
            'subtotal must equal itemtotal - discamount.',
          ),
        );
      }

      const effectiveTaxamount = taxamount ?? 0;
      if (
        itemSubtotal !== null &&
        itemGrandTotal !== null &&
        !amountsEqual(itemGrandTotal, itemSubtotal + effectiveTaxamount, minorUnit)
      ) {
        pushError(
          itemError(
            index,
            number,
            itemIndex,
            itemName ?? undefined,
            'grandtotal must equal subtotal + taxamount.',
          ),
        );
      }

      if (itemItemTotal !== null) sumItemTotal += itemItemTotal;
      if (itemSubtotal !== null) sumSubtotal += itemSubtotal;
      if (taxamount !== null) sumTaxAmount += taxamount;
      if (itemGrandTotal !== null) sumGrandTotal += itemGrandTotal;
    }

    if (itemtotal !== null && !amountsEqual(itemtotal, sumItemTotal, minorUnit)) {
      pushError(invoiceError(index, number ?? undefined, 'itemtotal must equal the sum of item itemtotal values.'));
    }

    if (subtotal !== null && !amountsEqual(subtotal, sumSubtotal, minorUnit)) {
      pushError(invoiceError(index, number ?? undefined, 'subtotal must equal the sum of item subtotal values.'));
    }

    if ('tax' in invoice && invoice['tax'] !== undefined && invoice['tax'] !== null) {
      const taxValue = readNumber(invoice['tax']);
      if (taxValue !== null && !amountsEqual(taxValue, sumTaxAmount, minorUnit)) {
        pushError(invoiceError(index, number ?? undefined, 'tax must equal the sum of item taxamount values.'));
      }
    }

    const roundoff = readNumber(invoice['roundoff']) ?? 0;
    if (grandtotal !== null && !amountsEqual(grandtotal, sumGrandTotal + roundoff, minorUnit)) {
      pushError(
        invoiceError(index, number ?? undefined, 'grandtotal must equal the sum of item grandtotal values plus roundoff.'),
      );
    }
  }

  return errors;
}

function validateAddress(
  value: unknown,
  fieldName: string,
  invoiceIndex: number,
  invoiceNumber: string | null,
  pushError: (message: string) => void,
): void {
  if (!isRecord(value)) {
    pushError(invoiceError(invoiceIndex, invoiceNumber ?? undefined, `${fieldName} must be an object.`));
    return;
  }

  pushUnknownKeyErrors(value, ADDRESS_KEYS, (message) =>
    pushError(invoiceError(invoiceIndex, invoiceNumber ?? undefined, `${fieldName}.${message}`)),
  );

  for (const key of ADDRESS_REQUIRED_KEYS) {
    if (!readNonEmptyString(value[key])) {
      pushError(
        invoiceError(
          invoiceIndex,
          invoiceNumber ?? undefined,
          `${fieldName}.${key} is required and must be a non-empty string.`,
        ),
      );
    }
  }

  for (const key of ['line2', 'mobile', 'email'] as const) {
    if (key in value && value[key] !== undefined && value[key] !== null && typeof value[key] !== 'string') {
      pushError(
        invoiceError(invoiceIndex, invoiceNumber ?? undefined, `${fieldName}.${key} must be a string.`),
      );
    }
  }
}

function validateTax(
  value: unknown,
  invoiceIndex: number,
  invoiceNumber: string | null,
  itemIndex: number,
  itemName: string | null,
  taxIndex: number,
  minorUnit: number,
  pushError: (message: string) => void,
): void {
  if (!isRecord(value)) {
    pushError(taxError(invoiceIndex, invoiceNumber, itemIndex, itemName, taxIndex, 'must be an object.'));
    return;
  }

  pushUnknownKeyErrors(value, TAX_KEYS, (message) =>
    pushError(taxError(invoiceIndex, invoiceNumber, itemIndex, itemName, taxIndex, message)),
  );

  if (!readNonEmptyString(value['name'])) {
    pushError(taxError(invoiceIndex, invoiceNumber, itemIndex, itemName, taxIndex, 'name is required and must be a non-empty string.'));
  }

  if (!readNonEmptyString(value['shortname'])) {
    pushError(
      taxError(
        invoiceIndex,
        invoiceNumber,
        itemIndex,
        itemName,
        taxIndex,
        'shortname is required and must be a non-empty string.',
      ),
    );
  }

  validateRequiredNonNegativeNumber(value, 'rate', invoiceIndex, invoiceNumber, pushError, {
    itemIndex,
    itemName: itemName ?? undefined,
    taxIndex,
  });
  validateRequiredNonNegativeNumber(value, 'appliedto', invoiceIndex, invoiceNumber, pushError, {
    itemIndex,
    itemName: itemName ?? undefined,
    taxIndex,
  });
  validateRequiredNonNegativeNumber(value, 'amount', invoiceIndex, invoiceNumber, pushError, {
    itemIndex,
    itemName: itemName ?? undefined,
    taxIndex,
  });

  for (const key of ['rate', 'appliedto', 'amount'] as const) {
    validateAmountPrecision(value[key], key, invoiceIndex, invoiceNumber, minorUnit, pushError, {
      itemIndex,
      itemName: itemName ?? undefined,
      taxIndex,
    });
  }
}

type FieldContext = Readonly<{
  itemIndex?: number;
  itemName?: string;
  taxIndex?: number;
  integer?: boolean;
  min?: number;
}>;

function validateIsoDate(
  value: unknown,
  fieldName: string,
  invoiceIndex: number,
  invoiceNumber: string | null,
  pushError: (message: string) => void,
): void {
  if (typeof value !== 'string' || !isIsoDateString(value)) {
    pushError(
      invoiceError(invoiceIndex, invoiceNumber ?? undefined, `${fieldName} must be formatted as YYYY-MM-DD.`),
    );
  }
}

function validateOptionalString(
  row: Record<string, unknown>,
  fieldName: string,
  invoiceIndex: number,
  invoiceNumber: string | null,
  pushError: (message: string) => void,
  context: FieldContext = {},
): void {
  if (!(fieldName in row) || row[fieldName] === undefined || row[fieldName] === null) return;

  if (typeof row[fieldName] !== 'string') {
    pushError(fieldMessage(invoiceIndex, invoiceNumber, fieldName, 'must be a string.', context));
  }
}

function validateOptionalNumber(
  row: Record<string, unknown>,
  fieldName: string,
  invoiceIndex: number,
  invoiceNumber: string | null,
  pushError: (message: string) => void,
  context: FieldContext = {},
): void {
  if (!(fieldName in row) || row[fieldName] === undefined || row[fieldName] === null) return;

  if (readNumber(row[fieldName]) === null) {
    pushError(fieldMessage(invoiceIndex, invoiceNumber, fieldName, 'must be a number.', context));
  }
}

function validateOptionalNonNegativeNumber(
  row: Record<string, unknown>,
  fieldName: string,
  invoiceIndex: number,
  invoiceNumber: string | null,
  pushError: (message: string) => void,
  context: FieldContext = {},
): number | null {
  if (!(fieldName in row) || row[fieldName] === undefined || row[fieldName] === null) {
    return null;
  }

  const value = readNumber(row[fieldName]);
  if (value === null) {
    pushError(fieldMessage(invoiceIndex, invoiceNumber, fieldName, 'must be a number.', context));
    return null;
  }

  if (value < 0) {
    pushError(fieldMessage(invoiceIndex, invoiceNumber, fieldName, 'must be greater than or equal to 0.', context));
    return null;
  }

  return value;
}

function validateRequiredNonNegativeNumber(
  row: Record<string, unknown>,
  fieldName: string,
  invoiceIndex: number,
  invoiceNumber: string | null,
  pushError: (message: string) => void,
  context: FieldContext = {},
): number | null {
  if (!(fieldName in row) || row[fieldName] === undefined || row[fieldName] === null) {
    pushError(fieldMessage(invoiceIndex, invoiceNumber, fieldName, 'is required and must be a number.', context));
    return null;
  }

  const value = readNumber(row[fieldName]);
  if (value === null) {
    pushError(fieldMessage(invoiceIndex, invoiceNumber, fieldName, 'must be a number.', context));
    return null;
  }

  if (value < 0) {
    pushError(fieldMessage(invoiceIndex, invoiceNumber, fieldName, 'must be greater than or equal to 0.', context));
    return null;
  }

  return value;
}

function validateRequiredNumber(
  row: Record<string, unknown>,
  fieldName: string,
  invoiceIndex: number,
  invoiceNumber: string | null,
  pushError: (message: string) => void,
  context: FieldContext = {},
): number | null {
  if (!(fieldName in row) || row[fieldName] === undefined || row[fieldName] === null) {
    pushError(fieldMessage(invoiceIndex, invoiceNumber, fieldName, 'is required and must be a number.', context));
    return null;
  }

  const value = readNumber(row[fieldName]);
  if (value === null) {
    pushError(fieldMessage(invoiceIndex, invoiceNumber, fieldName, 'must be a number.', context));
    return null;
  }

  const min = context.min ?? 0;
  if (value < min) {
    pushError(
      fieldMessage(
        invoiceIndex,
        invoiceNumber,
        fieldName,
        `must be greater than or equal to ${min}.`,
        context,
      ),
    );
    return null;
  }

  return value;
}

function validateAmountPrecision(
  value: unknown,
  fieldName: string,
  invoiceIndex: number,
  invoiceNumber: string | null,
  minorUnit: number,
  pushError: (message: string) => void,
  context: FieldContext = {},
): void {
  const numericValue = readNumber(value);
  if (numericValue === null) return;

  if (exceedsDecimalPrecision(numericValue, minorUnit)) {
    pushError(
      fieldMessage(
        invoiceIndex,
        invoiceNumber,
        fieldName,
        `must not exceed ${minorUnit} decimal place${minorUnit === 1 ? '' : 's'}.`,
        context,
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

function fieldMessage(
  invoiceIndex: number,
  invoiceNumber: string | null,
  fieldName: string,
  message: string,
  context: FieldContext,
): string {
  if (context.taxIndex !== undefined) {
    return taxError(
      invoiceIndex,
      invoiceNumber,
      context.itemIndex ?? 0,
      context.itemName ?? null,
      context.taxIndex,
      `${fieldName} ${message}`,
    );
  }

  if (context.itemIndex !== undefined) {
    return itemError(
      invoiceIndex,
      invoiceNumber,
      context.itemIndex,
      context.itemName,
      `${fieldName} ${message}`,
    );
  }

  return invoiceError(invoiceIndex, invoiceNumber ?? undefined, `${fieldName} ${message}`);
}

function invoiceError(index: number, number: string | undefined, message: string): string {
  const label = number?.trim() || '—';
  return `Invoice ${index + 1} (${label}): ${message}`;
}

function itemError(
  invoiceIndex: number,
  invoiceNumber: string | null,
  itemIndex: number,
  itemName: string | undefined,
  message: string,
): string {
  const invoiceLabel = invoiceNumber?.trim() || '—';
  const itemLabel = itemName?.trim() || `item ${itemIndex + 1}`;
  return `Invoice ${invoiceIndex + 1} (${invoiceLabel}), ${itemLabel}: ${message}`;
}

function taxError(
  invoiceIndex: number,
  invoiceNumber: string | null,
  itemIndex: number,
  itemName: string | null,
  taxIndex: number,
  message: string,
): string {
  const invoiceLabel = invoiceNumber?.trim() || '—';
  const itemLabel = itemName?.trim() || `item ${itemIndex + 1}`;
  return `Invoice ${invoiceIndex + 1} (${invoiceLabel}), ${itemLabel}, tax ${taxIndex + 1}: ${message}`;
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

function roundMoney(value: number, minorDigits: number): number {
  const factor = 10 ** minorDigits;
  return Math.round(value * factor) / factor;
}

function amountsEqual(left: number, right: number, minorDigits: number): boolean {
  return roundMoney(left, minorDigits) === roundMoney(right, minorDigits);
}

function exceedsDecimalPrecision(value: number, minorDigits: number): boolean {
  return Math.abs(value - roundMoney(value, minorDigits)) > 1e-9;
}
