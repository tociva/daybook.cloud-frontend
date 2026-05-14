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
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlDeleteButtonComponent } from '../../../../../../shared/burl-delete-button/burl-delete-button.component';
import { BankCashFacade, BankCashStore } from '../../../data/bank-cash';

@Component({
  selector: 'app-delete-bank-cash',
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
  templateUrl: './delete-bank-cash.component.html',
  styleUrl: './delete-bank-cash.component.css',
})
export class DeleteBankCashComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(BankCashFacade);
  protected readonly bankCashStore = inject(BankCashStore);
  protected readonly confirmed = signal(false);

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.bankCashStore.loadBankCashById(id);
    }
  }

  protected async deleteBankCash(): Promise<void> {
    const id = this.bankCashStore.selectedItem()?.id;
    if (!id || !this.confirmed()) {
      return;
    }

    await this.facade.delete(id);
  }
}
