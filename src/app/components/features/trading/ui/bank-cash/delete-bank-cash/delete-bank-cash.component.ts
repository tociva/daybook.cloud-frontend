import { Component, OnInit, inject, signal } from '@angular/core';
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
  TngCheckboxComponent,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BankCashStore } from '../../../data/bank-cash';

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
  private readonly router = inject(Router);
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

    const deleted = await this.bankCashStore.deleteBankCash(id);
    if (deleted) {
      await this.navigateBack();
    }
  }

  private async navigateBack(): Promise<void> {
    await this.router.navigateByUrl(this.getBackUrl());
  }

  private getBackUrl(): string {
    return this.route.snapshot.queryParamMap.get('burl') || '/';
  }
}
