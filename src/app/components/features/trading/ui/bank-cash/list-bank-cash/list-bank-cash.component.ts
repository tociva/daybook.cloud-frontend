import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  TngButtonComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
  TngInputComponent,
  TngTag,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { BankCashStore, Status } from '../../../data/bank-cash';
import type { BankCash } from '../../../data/bank-cash';
import { TngTagIcon } from '../tng-tag-icon.directive';

type StatusBadgeTone = 'danger' | 'success' | 'warning';

@Component({
  selector: 'app-list-bank-cash',
  imports: [
    TngButtonComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    TngIcon,
    TngInputComponent,
    TngTag,
    TngTagIcon,
  ],
  templateUrl: './list-bank-cash.component.html',
  styleUrl: './list-bank-cash.component.css',
})
export class ListBankCashComponent implements OnInit {
  private readonly router = inject(Router);
  protected readonly bankCashStore = inject(BankCashStore);
  protected readonly search = signal('');
  protected readonly pageSize = signal(10);
  protected readonly currentPage = signal(1);
  protected readonly totalPages = computed(() =>
    Math.max(Math.ceil(this.bankCashStore.count() / this.pageSize()), 1),
  );

  async ngOnInit(): Promise<void> {
    await this.loadBankCashes();
  }

  protected async onSearchChange(value: string): Promise<void> {
    this.search.set(value);
    this.currentPage.set(1);
    await this.loadBankCashes();
  }

  protected async goToPage(page: number): Promise<void> {
    this.currentPage.set(Math.min(Math.max(page, 1), this.totalPages()));
    await this.loadBankCashes();
  }

  protected createBankCash(): void {
    void this.router.navigate(['/app/trading/bank-cash/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected viewBankCash(item: BankCash): void {
    if (item.id) {
      void this.router.navigate(['/app/trading/bank-cash', item.id], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected editBankCash(item: BankCash): void {
    if (item.id) {
      void this.router.navigate(['/app/trading/bank-cash', item.id, 'edit'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected deleteBankCash(item: BankCash): void {
    if (item.id) {
      void this.router.navigate(['/app/trading/bank-cash', item.id, 'delete'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected handleActionKeydown(
    event: KeyboardEvent,
    item: BankCash,
    action: 'delete' | 'edit' | 'view',
  ): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    if (action === 'delete') {
      this.deleteBankCash(item);
      return;
    }

    if (action === 'edit') {
      this.editBankCash(item);
      return;
    }

    this.viewBankCash(item);
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

  private async loadBankCashes(): Promise<void> {
    await this.bankCashStore.loadBankCashes({
      limit: this.pageSize(),
      offset: (this.currentPage() - 1) * this.pageSize(),
      search: this.search(),
    });
  }
}
