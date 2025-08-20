import { SearchItemStateModel } from './search-item.model';

export const initialSearchItemState: SearchItemStateModel = {
  currentTitle: null,
  query: null,
  items: [{
    displayValue: 'Go to Dashboard',
    value: 'Dashboard',
    type: 'url',
    route: '/dashboard'
  },
  {
    displayValue: 'List all Bank Cash',
    value: 'Bank Cash : List',
    type: 'url',
    route: '/trading/bank-cash'
  },
  {
    displayValue: 'Create Bank Cash',
    value: 'Bank Cash : Create',
    type: 'url',
    route: '/trading/bank-cash/create'
  },],
};
