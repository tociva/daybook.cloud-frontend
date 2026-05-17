import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  TngButtonComponent,
  TngCardComponent,
  TngTable,
  TngTableCellTpl,
} from '@tailng-ui/components';
import type { TngTableColumn } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import {
  CrudFilterPopoverComponent,
  CrudListQueryService,
  CrudPaginatorComponent,
} from '../../../../../../shared/crud';
import type { CrudFilterField } from '../../../../../../shared/crud';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { EmptyStateComponent } from '../../../../../../shared/empty-state';
import { BranchStore } from '../../../data/branch';
import type { Branch } from '../../../data/branch';

@Component({
  selector: 'app-list-branch',
  standalone: true,
  imports: [
    PageHeadingComponent,
    TngButtonComponent,
    TngCardComponent,
    CrudFilterPopoverComponent,
    CrudPaginatorComponent,
    TngIcon,
    EmptyStateComponent,
    TngTable,
    TngTableCellTpl,
  ],
  templateUrl: './list-branch.component.html',
  styleUrl: './list-branch.component.css',
  providers: [CrudListQueryService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListBranchComponent {
  private readonly router = inject(Router);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly branchStore = inject(BranchStore);
  protected readonly hasError = computed(() => this.branchStore.error() !== null);

  protected readonly columns: readonly TngTableColumn<Branch>[] = [
    { id: 'name', label: 'Name', sortable: true, width: '14rem' },
    { id: 'email', label: 'Email', sortable: true, truncate: true },
    { id: 'mobile', label: 'Mobile', sortable: true, width: '10rem' },
    { id: 'currencycode', label: 'Currency', sortable: true, width: '8rem' },
    { id: 'countrycode', label: 'Country', sortable: true, width: '8rem' },
    { id: 'description', label: 'Description', sortable: true, truncate: true },
    { id: 'actions', label: 'Actions', align: 'end', headerAlign: 'end', width: '8rem' },
  ];

  protected readonly filterFields: readonly CrudFilterField[] = [
    { id: 'name', label: 'Name', placeholder: 'Branch name', type: 'text' },
    { id: 'email', label: 'Email', placeholder: 'Email address', type: 'text' },
    { id: 'mobile', label: 'Mobile', placeholder: 'Mobile number', type: 'text' },
    { id: 'countrycode', label: 'Country code', placeholder: 'e.g. IN', type: 'text' },
  ];

  constructor() {
    this.crudQuery.init((filter) => void this.branchStore.loadBranches(filter));
  }

  protected createBranch(): void {
    void this.router.navigate(['/app/management/branch/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected viewBranch(item: Branch): void {
    if (item.id) {
      void this.router.navigate(['/app/management/branch', item.id], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected editBranch(item: Branch): void {
    if (item.id) {
      void this.router.navigate(['/app/management/branch', item.id, 'edit'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected deleteBranch(item: Branch): void {
    if (item.id) {
      void this.router.navigate(['/app/management/branch', item.id, 'delete'], {
        queryParams: { burl: this.router.url },
      });
    }
  }
}
