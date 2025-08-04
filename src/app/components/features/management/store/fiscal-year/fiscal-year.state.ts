import { createInitialBaseListState } from '../../../../../../util/base-list.initial';
import { BaseListModel } from '../../../../../../util/base-list.model';
import { FiscalYear } from './fiscal-year.model';

export type FiscalYearModel = BaseListModel<FiscalYear>;

export const initialFiscalYearState: FiscalYearModel = createInitialBaseListState<FiscalYear>(); 