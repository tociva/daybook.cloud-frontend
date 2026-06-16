import { HttpParams } from '@angular/common/http';
import type { BankCashReportQuery } from './bank-cash-report.model';

export function buildBankCashReportHttpParams(query: BankCashReportQuery = {}): HttpParams {
  let params = new HttpParams();

  if (query.bcashid) params = params.set('bcashid', query.bcashid);
  if (query.start) params = params.set('start', query.start);
  if (query.end) params = params.set('end', query.end);

  return params;
}
