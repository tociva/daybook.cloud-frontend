import { Injectable, inject } from '@angular/core';
import { CrudApiService } from '../../../../../shared/crud';
import type { BankMatch, BankMatchCreatePayload } from './bank-match.model';

const ENDPOINT = '/accounting/bank-match';

@Injectable({ providedIn: 'root' })
export class BankMatchService {
  private readonly crudApi = inject(CrudApiService);

  async create(payload: BankMatchCreatePayload): Promise<BankMatch> {
    return this.crudApi.create<BankMatch, BankMatchCreatePayload>(ENDPOINT, payload);
  }
}
