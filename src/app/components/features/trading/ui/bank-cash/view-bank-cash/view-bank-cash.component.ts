import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  TngButtonComponent,
  TngCardActionsComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardFooterComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
  TngTag,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlNavigationService } from '../../../../../../shared/burl-back-button/burl-navigation.service';
import { BankCashStore, Status } from '../../../data/bank-cash';
import type { BankCash } from '../../../data/bank-cash';
import { TngTagIcon } from '../tng-tag-icon.directive';

type StatusBadgeTone = 'danger' | 'success' | 'warning';

@Component({
  selector: 'app-view-bank-cash',
  imports: [
    TngButtonComponent,
    TngCardActionsComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardFooterComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    TngIcon,
    TngTag,
    TngTagIcon,
    BurlBackButtonComponent,
  ],
  templateUrl: './view-bank-cash.component.html',
  styleUrl: './view-bank-cash.component.css',
})
export class ViewBankCashComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly burlNavigation = inject(BurlNavigationService);
  protected readonly bankCashStore = inject(BankCashStore);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.bankCashStore.loadBankCashById(id);
    }
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
