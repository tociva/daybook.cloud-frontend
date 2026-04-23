// bank-ledger-map.store.ts
import { createBaseListStore } from '../../../../../util/store/base-list/base-list.store';
import { BankCashLedgerMap } from './bank-ledger-map.model';

export const BankLedgerMapStore = createBaseListStore<BankCashLedgerMap>('bank-cash-ledger-map');

