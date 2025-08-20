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
    value: 'Bank Cash',
    type: 'url',
    route: '/trading/bank-cash'
  },],
};
