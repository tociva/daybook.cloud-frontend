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
} from '@tailng-ui/components';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlNavigationService } from '../../../../../../shared/burl-back-button/burl-navigation.service';
import { BurlEditButtonComponent } from '../../../../../../shared/burl-edit-button/burl-edit-button.component';
import { formatAmountWithCurrency } from '../../../../../../shared/format/currency';
import { ContraTransactionStore } from '../../../data/contra-transaction';
import type { ContraTransaction } from '../../../data/contra-transaction';

@Component({
  selector: 'app-view-bank-contra',
  imports: [
    TngCardActionsComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardFooterComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    BurlBackButtonComponent,
    BurlEditButtonComponent,
  ],
  templateUrl: './view-bank-contra.component.html',
  styleUrl: './view-bank-contra.component.css',
})
export class ViewBankContraComponent {
  private readonly burlNavigation = inject(BurlNavigationService);
  private readonly dateManagement = inject(DateManagementService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly contraTransactionStore = inject(ContraTransactionStore);

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    this.contraTransactionStore.clearError();

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    const cached = this.contraTransactionStore.selectedItem();
    if (cached?.id === id && cached.frombcash && cached.tobcash) return;

    await this.contraTransactionStore.loadContraTransactionById(id, {
      includes: ['frombcash', 'tobcash'],
    });
  }

  protected edit(): void {
    const id = this.contraTransactionStore.selectedItem()?.id;
    if (!id) return;

    void this.router.navigate(['/app/trading/bank-cash/contra', id, 'edit'], {
      queryParams: { burl: this.burlNavigation.getBackUrl() },
    });
  }

  protected formatDate(value: string | undefined): string {
    return this.dateManagement.formatDisplayDate(value, '-');
  }

  protected formatAmount(item: ContraTransaction): string {
    return formatAmountWithCurrency(item.amount, item.currencycode);
  }

  protected accountName(item: ContraTransaction, leg: 'from' | 'to'): string {
    return leg === 'from'
      ? (item.frombcash?.name ?? item.frombcashid)
      : (item.tobcash?.name ?? item.tobcashid);
  }
}
