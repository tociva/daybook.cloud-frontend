import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  TngButtonComponent,
  TngCardComponent,
  TngTag,
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
import { BankCashStore, Status } from '../../../data/bank-cash';
import type { BankCash } from '../../../data/bank-cash';
import { TngTagIcon } from '../tng-tag-icon.directive';

type StatusBadgeTone = 'danger' | 'success' | 'warning';

@Component({
  selector: 'app-list-bank-cash',
  imports: [
    PageHeadingComponent,
    TngButtonComponent,
    TngCardComponent,
    CrudFilterPopoverComponent,
    CrudPaginatorComponent,
    TngIcon,
    TngTag,
    TngTagIcon,
    EmptyStateComponent,
    TngTable,
    TngTableCellTpl,
  ],
  templateUrl: './list-bank-cash.component.html',
  styleUrl: './list-bank-cash.component.css',
  providers: [CrudListQueryService],
})
export class ListBankCashComponent {
  private readonly router = inject(Router);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly bankCashStore = inject(BankCashStore);
  protected readonly hasError = computed(() => this.bankCashStore.error() !== null);
  protected readonly columns: readonly TngTableColumn<BankCash>[] = [
    { id: 'name', label: 'Name', sortable: true, width: '18rem' },
    { id: 'description', label: 'Description', sortable: true, truncate: true },
    { id: 'status', label: 'Status', sortable: true, width: '9rem' },
    { id: 'actions', label: 'Actions', align: 'end', headerAlign: 'end', width: '8rem' },
  ];
  protected readonly filterFields: readonly CrudFilterField[] = [
    {
      id: 'name',
      label: 'Name',
      placeholder: 'Account name',
      type: 'text',
    },
    {
      id: 'description',
      label: 'Description',
      placeholder: 'Description',
      type: 'text',
    },
    {
      id: 'status',
      label: 'Status',
      options: [
        { label: 'Active', value: Status.ACTIVE },
        { label: 'Inactive', value: Status.INACTIVE },
        { label: 'Deleted', value: Status.DELETED },
      ],
      placeholder: 'Any status',
      type: 'enum',
    },
  ];

  constructor() {
    this.crudQuery.init((filter) => void this.bankCashStore.loadBankCashes(filter));
  }

  protected createBankCash(): void {
    void this.router.navigate(['/app/trading/bank-cash/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected viewBankCash(item: BankCash): void {
    if (item.id) {
      this.bankCashStore.setSelectedItem(item);
      void this.router.navigate(['/app/trading/bank-cash', item.id], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected editBankCash(item: BankCash): void {
    if (item.id) {
      this.bankCashStore.setSelectedItem(item);
      void this.router.navigate(['/app/trading/bank-cash', item.id, 'edit'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected deleteBankCash(item: BankCash): void {
    if (item.id) {
      this.bankCashStore.setSelectedItem(item);
      void this.router.navigate(['/app/trading/bank-cash', item.id, 'delete'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected getStatusLabel(status: BankCash['status']): string {
    switch (status) {
      case Status.INACTIVE:
        return 'Inactive';
      case Status.DELETED:
        return 'Deleted';
      case Status.ACTIVE:
      case undefined:
        return 'Active';
      default:
        return String(status);
    }
  }

  protected getStatusTone(status: BankCash['status']): StatusBadgeTone {
    switch (status) {
      case Status.INACTIVE:
        return 'warning';
      case Status.DELETED:
        return 'danger';
      case Status.ACTIVE:
      case undefined:
      default:
        return 'success';
    }
  }
}
