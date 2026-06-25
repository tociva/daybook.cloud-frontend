import { Component, computed, inject } from '@angular/core';
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
import { TableRowIconButtonComponent } from '../../../../../../shared/table-row-icon-button';
import { OrganizationStore } from '../../../data/organization';
import type { Organization } from '../../../data/organization';

import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
@Component({
  selector: 'app-list-organization',
  standalone: true,
  imports: [
    PageHeadingComponent,
    BurlBackButtonComponent,
    TngButtonComponent,
    TngCardComponent,
    CrudFilterPopoverComponent,
    CrudPaginatorComponent,
    TngIcon,
    EmptyStateComponent,
    TngTable,
    TngTableCellTpl,
    TableRowIconButtonComponent,
  ],
  templateUrl: './list-organization.component.html',
  styleUrl: './list-organization.component.css',
  providers: [CrudListQueryService],
})
export class ListOrganizationComponent {
  private readonly router = inject(Router);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly organizationStore = inject(OrganizationStore);
  protected readonly hasError = computed(() => this.organizationStore.error() !== null);

  protected readonly columns: readonly TngTableColumn<Organization>[] = [
    { id: 'name', label: 'Name', sortable: true, width: '16rem' },
    { id: 'email', label: 'Email', sortable: true, truncate: true },
    { id: 'mobile', label: 'Mobile', sortable: true, width: '10rem' },
    { id: 'description', label: 'Description', sortable: true, truncate: true },
    { id: 'actions', label: 'Actions', align: 'end', headerAlign: 'end', width: '8rem' },
  ];

  protected readonly filterFields: readonly CrudFilterField[] = [
    { id: 'name', label: 'Name', placeholder: 'Organization name', type: 'text' },
    { id: 'email', label: 'Email', placeholder: 'Email address', type: 'text' },
    { id: 'mobile', label: 'Mobile', placeholder: 'Mobile number', type: 'text' },
  ];

  constructor() {
    this.crudQuery.init((filter) => void this.organizationStore.loadOrganizations(filter));
  }

  protected createOrganization(): void {
    void this.router.navigate(['/app/management/organization/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected viewOrganization(item: Organization): void {
    if (item.id) {
      void this.router.navigate(['/app/management/organization', item.id], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected editOrganization(item: Organization): void {
    if (item.id) {
      void this.router.navigate(['/app/management/organization', item.id, 'edit'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected deleteOrganization(item: Organization): void {
    if (item.id) {
      void this.router.navigate(['/app/management/organization', item.id, 'delete'], {
        queryParams: { burl: this.router.url },
      });
    }
  }
}
