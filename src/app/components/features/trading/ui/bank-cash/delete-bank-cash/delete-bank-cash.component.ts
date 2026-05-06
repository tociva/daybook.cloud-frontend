import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  TngButtonComponent,
  TngCardActionsComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardFooterComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
  TngCheckboxComponent,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BankCashFacade, BankCashStore } from '../../../data/bank-cash';

@Component({
  selector: 'app-delete-bank-cash',
  imports: [
    TngButtonComponent,
    TngCardActionsComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardFooterComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    TngCheckboxComponent,
    TngIcon,
    BurlBackButtonComponent,
  ],
  templateUrl: './delete-bank-cash.component.html',
  styleUrl: './delete-bank-cash.component.css',
})
export class DeleteBankCashComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(BankCashFacade);
  protected readonly bankCashStore = inject(BankCashStore);
  protected readonly confirmed = signal(false);

  async ngOnInit(): Promise<void> {
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
