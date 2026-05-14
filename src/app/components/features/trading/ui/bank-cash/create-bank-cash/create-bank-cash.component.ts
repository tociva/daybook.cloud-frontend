import { AfterViewInit, Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { ActivatedRoute } from '@angular/router';
import {
  TngCardActionsComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardFooterComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
  TngError,
  TngFormFieldComponent,
  TngInputComponent,
  TngLabelComponent,
  TngTextareaComponent,
} from '@tailng-ui/components';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlCreateButtonComponent } from '../../../../../../shared/burl-create-button/burl-create-button.component';
import { BankCashFacade, BankCashStore } from '../../../data/bank-cash';
import type { BankCashPayload } from '../../../data/bank-cash';

type BankCashFormModel = {
  description: string;
  name: string;
};

@Component({
  selector: 'app-create-bank-cash',
  imports: [
    FormField,
    TngCardActionsComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardFooterComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    TngError,
    TngFormFieldComponent,
    TngInputComponent,
    TngLabelComponent,
    TngTextareaComponent,
    BurlBackButtonComponent,
    BurlCreateButtonComponent,
  ],
  templateUrl: './create-bank-cash.component.html',
  styleUrl: './create-bank-cash.component.css',
})
export class CreateBankCashComponent implements AfterViewInit {
  @ViewChild('nameInputRef', { read: ElementRef }) private nameInputRef!: ElementRef;
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(BankCashFacade);
  protected readonly bankCashStore = inject(BankCashStore);
  protected readonly bankCashModel = signal<BankCashFormModel>({
    description: '',
    name: '',
  });
  protected readonly bankCashForm = form(this.bankCashModel);
  protected readonly id = signal<string | null>(null);
  protected readonly submitted = signal(false);
  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly title = computed(() =>
    this.mode() === 'edit' ? 'Edit Bank/Cash' : 'Create Bank/Cash',
  );
  protected readonly nameError = computed(() =>
    this.submitted() && this.bankCashModel().name.trim().length === 0 ? 'Name is required' : null,
  );

  constructor() {
    void this.loadInitialState();
  }

  ngAfterViewInit(): void {
    this.nameInputRef?.nativeElement.querySelector('input')?.focus();
  }

  private async loadInitialState(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    this.id.set(id);

    if (!id) {
      this.bankCashStore.clearSelectedItem();
      return;
    }

    const bankCash = await this.bankCashStore.loadBankCashById(id);
    if (bankCash) {
      this.bankCashModel.set({
        description: bankCash.description ?? '',
        name: bankCash.name,
      });
    }
  }

  protected async submitForm(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.submitted.set(true);

    if (this.nameError()) {
      return;
    }

    const model = this.bankCashModel();
    const payload: BankCashPayload = {
      name: model.name.trim(),
      ...(model.description.trim() ? { description: model.description.trim() } : {}),
    };
    const id = this.id();
    if (id) {
      await this.facade.update(id, payload);
    } else {
      await this.facade.create(payload);
    }
  }
}
