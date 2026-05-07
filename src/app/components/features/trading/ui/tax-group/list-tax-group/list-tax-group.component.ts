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
import { TaxGroupStore } from '../../../data/tax-group';
import type { TaxGroup } from '../../../data/tax-group';

@Component({
  selector: 'app-list-tax-group',
  imports: [
    PageHeadingComponent,
    TngButtonComponent,
    TngCardComponent,
    CrudFilterPopoverComponent,
    CrudPaginatorComponent,
    TngIcon,
    TngTable,
    TngTableCellTpl,
  ],
  templateUrl: './list-tax-group.component.html',
  styleUrl: './list-tax-group.component.css',
  providers: [CrudListQueryService],
})
export class ListTaxGroupComponent {
  private readonly router = inject(Router);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly taxGroupStore = inject(TaxGroupStore);
  protected readonly hasError = computed(() => this.taxGroupStore.error() !== null);
  protected readonly columns: readonly TngTableColumn<TaxGroup>[] = [
    { id: 'name', label: 'Name', sortable: true, width: '16rem' },
    { id: 'rate', label: 'Rate (%)', sortable: true, width: '8rem' },
    { id: 'description', label: 'Description', sortable: true, truncate: true },
    { id: 'actions', label: 'Actions', align: 'end', headerAlign: 'end', width: '8rem' },
  ];
  protected readonly filterFields: readonly CrudFilterField[] = [
    { id: 'name', label: 'Name', placeholder: 'Tax group name', type: 'text' },
    { id: 'description', label: 'Description', placeholder: 'Description', type: 'text' },
  ];

  constructor() {
    this.crudQuery.init((filter) => void this.taxGroupStore.loadTaxGroups(filter));
  }

  protected createTaxGroup(): void {
    void this.router.navigate(['/app/trading/tax-group/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected openTaxes(): void {
    void this.router.navigate(['/app/trading/tax']);
  }

  protected viewTaxGroup(item: TaxGroup): void {
    if (item.id) {
      void this.router.navigate(['/app/trading/tax-group', item.id], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected editTaxGroup(item: TaxGroup): void {
    if (item.id) {
      void this.router.navigate(['/app/trading/tax-group', item.id, 'edit'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected deleteTaxGroup(item: TaxGroup): void {
    if (item.id) {
      void this.router.navigate(['/app/trading/tax-group', item.id, 'delete'], {
        queryParams: { burl: this.router.url },
      });
    }
  }
}
