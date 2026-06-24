import type { CrudFilterField } from '../../../../shared/crud';

export const PAYMENT_STATUS_FULLY_PAID = 'fully_paid';
export const PAYMENT_STATUS_PARTIALLY_PAID = 'partially_paid';
export const PAYMENT_STATUS_NOT_PAID = 'not_paid';

export const PAYMENT_STATUS_NOT_PAID_FILTER = {
  where: {
    paymentstatus: PAYMENT_STATUS_NOT_PAID,
  },
} as const;

export const PAYMENT_STATUS_FILTER_FIELD = {
  id: 'paymentstatus',
  label: 'Payment status',
  placeholder: 'Any payment status',
  type: 'enum',
  options: [
    { label: 'Fully paid', value: PAYMENT_STATUS_FULLY_PAID },
    { label: 'Partially paid', value: PAYMENT_STATUS_PARTIALLY_PAID },
    { label: 'Not paid', value: PAYMENT_STATUS_NOT_PAID },
  ],
} satisfies CrudFilterField;
