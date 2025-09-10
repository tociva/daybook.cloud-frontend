import { createBaseListStore } from '../../../../../util/store/base-list/base-list.store';
import { FiscalYear } from './fiscal-year.model';

export const FiscalYearStore = createBaseListStore<FiscalYear>('fiscal-year');
