import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  TngCardActionsComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardFooterComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
  TngTag,
} from '@tailng-ui/components';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlEditButtonComponent } from '../../../../../../shared/burl-edit-button/burl-edit-button.component';
import { BurlNavigationService } from '../../../../../../shared/burl-back-button/burl-navigation.service';
import { BankCashStore, Status } from '../../../data/bank-cash';
import type { BankCash } from '../../../data/bank-cash';
import { TngTagIcon } from '../tng-tag-icon.directive';

type StatusBadgeTone = 'danger' | 'success' | 'warning';

@Component({
  selector: 'app-view-bank-cash',
  imports: [
    TngCardActionsComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardFooterComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    TngTag,
    TngTagIcon,
    BurlBackButtonComponent,
    BurlEditButtonComponent,
  ],
  templateUrl: './view-bank-cash.component.html',
  styleUrl: './view-bank-cash.component.css',
})
export class ViewBankCashComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly burlNavigation = inject(BurlNavigationService);
  protected readonly bankCashStore = inject(BankCashStore);

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    if (this.bankCashStore.selectedItem()?.id === id) return;
    await this.bankCashStore.loadBankCashById(id);
  }

  protected edit(): void {
    const id = this.bankCashStore.selectedItem()?.id;
    if (id) {
      void this.router.navigate(['/app/trading/bank-cash', id, 'edit'], {
        queryParams: { burl: this.burlNavigation.getBackUrl() },
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
