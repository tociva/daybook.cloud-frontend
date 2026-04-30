import { Component, OnInit, computed, inject, signal } from '@angular/core';
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
  TngInputComponent,
  TngLabelComponent,
  TngTextareaComponent,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BankCashStore } from '../../../data/bank-cash';
import type { BankCashPayload } from '../../../data/bank-cash';

@Component({
  selector: 'app-create-bank-cash',
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
    TngInputComponent,
    TngLabelComponent,
    TngTextareaComponent,
    BurlBackButtonComponent,
  ],
  templateUrl: './create-bank-cash.component.html',
  styleUrl: './create-bank-cash.component.css',
})
export class CreateBankCashComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly bankCashStore = inject(BankCashStore);
  protected readonly description = signal('');
  protected readonly id = signal<string | null>(null);
  protected readonly name = signal('');
  protected readonly submitted = signal(false);
  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly title = computed(() =>
    this.mode() === 'edit' ? 'Edit Bank/Cash' : 'Create Bank/Cash',
  );
  protected readonly nameError = computed(() =>
    this.submitted() && this.name().trim().length === 0 ? 'Name is required' : null,
  );

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    this.id.set(id);

    if (!id) {
      this.bankCashStore.clearSelectedItem();
      return;
    }

    const bankCash = await this.bankCashStore.loadBankCashById(id);
    if (bankCash) {
      this.name.set(bankCash.name);
      this.description.set(bankCash.description ?? '');
    }
  }

  protected async submitForm(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.submitted.set(true);

    if (this.nameError()) {
      return;
    }

    const payload: BankCashPayload = {
      name: this.name().trim(),
      ...(this.description().trim() ? { description: this.description().trim() } : {}),
    };
    const id = this.id();
    const saved = id
      ? await this.bankCashStore.updateBankCash(id, payload)
      : await this.bankCashStore.createBankCash(payload);

    if (saved) {
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
