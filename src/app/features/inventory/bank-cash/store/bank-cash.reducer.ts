import { createReducer, on } from '@ngrx/store';
import { BankCashState } from './bank-cash.model';
import * as BankCashActions from './bank-cash.actions';

const initialState: BankCashState = {
  bankCashList: [],
  selectedBankCash: null,
  count: 0,
  error: null,
};

export const bankCashReducer = createReducer(
  initialState,
  on(BankCashActions.loadBankCashSuccess, (state, { bankCashList, count }) => ({
    ...state,
    bankCashList,
    count,
    error: null,
  })),
  on(BankCashActions.loadBankCashFailure, (state, { error }) => ({
    ...state,
    error,
  })),
  on(BankCashActions.selectBankCash, (state, { id }) => ({
    ...state,
    selectedBankCash: state.bankCashList.find(b => b.id === id) || null,
  })),
  on(BankCashActions.createBankCashSuccess, (state, { bankCash }) => ({
    ...state,
    bankCashList: [bankCash, ...state.bankCashList],
  })),
  on(BankCashActions.updateBankCashSuccess, (state, { bankCash }) => ({
    ...state,
    bankCashList: state.bankCashList.map(b => b.id === bankCash.id ? bankCash : b),
  })),
  on(BankCashActions.deleteBankCashSuccess, (state, { id }) => ({
    ...state,
    bankCashList: state.bankCashList.filter(b => b.id !== id),
  }))
);
