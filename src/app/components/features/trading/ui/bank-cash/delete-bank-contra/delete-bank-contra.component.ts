import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  TngCardActionsComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardFooterComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
  TngCheckboxComponent,
} from '@tailng-ui/components';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlDeleteButtonComponent } from '../../../../../../shared/burl-delete-button/burl-delete-button.component';
import { formatAmountWithCurrency } from '../../../../../../shared/format/currency';
import { ContraTransactionFacade, ContraTransactionStore } from '../../../data/contra-transaction';
import type { ContraTransaction } from '../../../data/contra-transaction';

@Component({
  selector: 'app-delete-bank-contra',
  imports: [
    TngCardActionsComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardFooterComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    TngCheckboxComponent,
    BurlBackButtonComponent,
    BurlDeleteButtonComponent,
  ],
  templateUrl: './delete-bank-contra.component.html',
  styleUrl: './delete-bank-contra.component.css',
})
export class DeleteBankContraComponent {
  private readonly dateManagement = inject(DateManagementService);
  private readonly facade = inject(ContraTransactionFacade);
  private readonly route = inject(ActivatedRoute);
  protected readonly contraTransactionStore = inject(ContraTransactionStore);
  protected readonly confirmed = signal(false);

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

  protected async deleteContra(): Promise<void> {
    const id = this.contraTransactionStore.selectedItem()?.id;
    if (!id || !this.confirmed()) return;

    await this.facade.delete(id);
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
