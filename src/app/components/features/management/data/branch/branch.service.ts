import { Injectable, inject } from '@angular/core';
import { CrudApiService } from '../../../../../shared/crud';
import type { Branch, BranchGetQuery, BranchListQuery, BranchPayload } from './branch.model';

const BRANCH_ENDPOINT = '/organization/branch';

@Injectable({ providedIn: 'root' })
export class BranchService {
  private readonly crudApi = inject(CrudApiService);

  async create(payload: BranchPayload): Promise<Branch> {
    return this.crudApi.create<Branch, BranchPayload>(BRANCH_ENDPOINT, payload);
  }

  async delete(id: string): Promise<void> {
    return this.crudApi.delete(BRANCH_ENDPOINT, id);
  }

  async getById(id: string, query?: BranchGetQuery): Promise<Branch> {
    return this.crudApi.getById<Branch>(BRANCH_ENDPOINT, id, query);
  }

  async list(query: BranchListQuery = {}): Promise<readonly Branch[]> {
    return this.crudApi.list<Branch>(BRANCH_ENDPOINT, query);
  }

  async count(query: BranchListQuery = {}): Promise<number> {
    return this.crudApi.count(BRANCH_ENDPOINT, query);
  }

  async update(id: string, payload: BranchPayload): Promise<Branch> {
    return this.crudApi.update<Branch, BranchPayload>(BRANCH_ENDPOINT, id, payload);
  }
}
