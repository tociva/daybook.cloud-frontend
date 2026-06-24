import type { CrudFilterField } from '../../../../shared/crud';

export const RECEIPT_STATUS_FULLY_PAID = 'fully_paid';
export const RECEIPT_STATUS_PARTIALLY_PAID = 'partially_paid';
export const RECEIPT_STATUS_NOT_PAID = 'not_paid';

export const RECEIPT_STATUS_NOT_PAID_FILTER = {
  where: {
    receiptstatus: RECEIPT_STATUS_NOT_PAID,
  },
} as const;

export const RECEIPT_STATUS_FILTER_FIELD = {
  id: 'receiptstatus',
  label: 'Receipt status',
  placeholder: 'Any receipt status',
  type: 'enum',
  options: [
    { label: 'Fully paid', value: RECEIPT_STATUS_FULLY_PAID },
    { label: 'Partially paid', value: RECEIPT_STATUS_PARTIALLY_PAID },
    { label: 'Not paid', value: RECEIPT_STATUS_NOT_PAID },
  ],
} satisfies CrudFilterField;
