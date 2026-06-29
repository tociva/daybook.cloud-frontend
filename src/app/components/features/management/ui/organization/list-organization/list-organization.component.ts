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
import { CanDirective } from '../../../../../../core/permissions/can.directive';
import {
  CrudFilterPopoverComponent,
  CrudListQueryService,
  CrudPaginatorComponent,
} from '../../../../../../shared/crud';
import type { CrudFilterField } from '../../../../../../shared/crud';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { EmptyStateComponent } from '../../../../../../shared/empty-state';
import { TableRowIconButtonComponent } from '../../../../../../shared/table-row-icon-button';
import {
  XlsxExportButtonComponent,
  columnsFromTable,
  createCrudListXlsxDocument,
  text,
} from '../../../../../../shared/xlsx-export';
import { OrganizationService, OrganizationStore } from '../../../data/organization';
import type { Organization } from '../../../data/organization';

import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
@Component({
  selector: 'app-list-organization',
  standalone: true,
  imports: [
    CanDirective,
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
    XlsxExportButtonComponent,
  ],
  templateUrl: './list-organization.component.html',
  styleUrl: './list-organization.component.css',
  providers: [CrudListQueryService],
})
export class ListOrganizationComponent {
  private readonly router = inject(Router);
  private readonly organizationService = inject(OrganizationService);
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

  protected readonly exportOrganizations = () =>
    createCrudListXlsxDocument({
      cachedRows: this.organizationStore.items(),
      cachedTotal: this.organizationStore.count(),
      columns: columnsFromTable(this.columns),
      count: (query) => this.organizationService.count(query),
      fileNameBase: 'organizations',
      list: (query) => this.organizationService.list(query),
      mapRow: (organization) => [
        text(organization.name),
        text(organization.email),
        text(organization.mobile),
        text(organization.description),
      ],
      query: this.crudQuery.filter(),
      sheetName: 'Organizations',
      title: 'Organizations',
    });

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
