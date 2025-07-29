import { createAction, props } from '@ngrx/store';
import { BankCash } from './bank-cash.model';
import { ListApiQuery } from '../../../../util/list-api-query.type';

export const loadBankCash = createAction('[BankCash] Load', props<{ query?: ListApiQuery }>());
export const loadBankCashSuccess = createAction('[BankCash] Load Success', props<{ bankCashList: BankCash[], count: number }>());
export const loadBankCashFailure = createAction('[BankCash] Load Failure', props<{ error: unknown }>());

export const selectBankCash = createAction('[BankCash] Select', props<{ id: string }>());

export const createBankCash = createAction('[BankCash] Create', props<{ bankCash: BankCash }>());
export const createBankCashSuccess = createAction('[BankCash] Create Success', props<{ bankCash: BankCash }>());
export const createBankCashFailure = createAction('[BankCash] Create Failure', props<{ error: unknown }>());

export const updateBankCash = createAction('[BankCash] Update', props<{ id: string, bankCash: BankCash }>());
export const updateBankCashSuccess = createAction('[BankCash] Update Success', props<{ bankCash: BankCash }>());
export const updateBankCashFailure = createAction('[BankCash] Update Failure', props<{ error: unknown }>());

export const deleteBankCash = createAction('[BankCash] Delete', props<{ id: string }>());
export const deleteBankCashSuccess = createAction('[BankCash] Delete Success', props<{ id: string }>());
export const deleteBankCashFailure = createAction('[BankCash] Delete Failure', props<{ error: unknown }>());
