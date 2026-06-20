import type { CrudFilterField } from '../../../../shared/crud';

export const JOURNAL_LINK_STATUS_NOT_FULLY_LINKED = 'not_fully_linked';

export const JOURNAL_LINK_STATUS_NOT_FULLY_LINKED_FILTER = {
  where: {
    journallinkstatus: JOURNAL_LINK_STATUS_NOT_FULLY_LINKED,
  },
} as const;

export const JOURNAL_LINK_STATUS_FILTER_CLEAR_QUERY_PARAMS = [
  'dashboardAction',
  'fromDate',
  'limit',
  'order',
  'skip',
  'sourceType',
  'status',
  'toDate',
] as const;

export const JOURNAL_LINK_STATUS_FILTER_FIELD = {
  id: 'journallinkstatus',
  label: 'Journal link status',
  placeholder: 'Any journal link status',
  type: 'enum',
  options: [
    { label: 'Not fully linked', value: JOURNAL_LINK_STATUS_NOT_FULLY_LINKED },
    { label: 'No journals', value: 'unlinked' },
    { label: 'Partially linked', value: 'partial' },
    { label: 'Fully linked', value: 'linked' },
  ],
} satisfies CrudFilterField;
