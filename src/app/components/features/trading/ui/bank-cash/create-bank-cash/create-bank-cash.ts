import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { FormUtil } from '../../../../../../util/form/form.util';
import { willPassRequiredValidation } from '../../../../../../util/form/validation.uti';
import { FormField } from '../../../../../../util/types/form-field.model';
import { TwoColumnFormComponent } from '../../../../../shared/forms/two-column-form/two-column-form.component';
import { bankCashActions, BankCashCU, BankCashStore } from '../../../store/bank-cash';
import { FormValidator } from '../../../../../../util/form/form-validator';
import { ActionCreator, Store } from '@ngrx/store';
import { SkeltonLoader } from '../../../../../shared/skelton-loader/skelton-loader';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-create-bank-cash',
  imports: [TwoColumnFormComponent, SkeltonLoader],
  templateUrl: './create-bank-cash.html',
  styleUrl: './create-bank-cash.css'
})
export class CreateBankCash implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly bankCashStore = inject(BankCashStore);
  readonly selectedBankCash = this.bankCashStore.selectedItem;
  successAction = signal<ActionCreator[] | ActionCreator | null>(null);
  protected loading = true;
  protected mode:'create'|'edit' = 'create';
  private itemId = signal<string | null>(null);


  readonly formFields = signal<FormField[]>([
    // 🟦 Basic Details
    { key: 'name', label: 'Name', type: 'text', required: true, group: 'Basic Details', validators:(value: unknown) => {
      if(!willPassRequiredValidation(value as string)) {
        return ['Name is required'];
      }
      return [];
    }},
    { key: 'description', label: 'Description', type: 'text', required: false, group: 'Basic Details'},
  ]);

  readonly form: FormGroup = FormUtil.buildForm(this.formFields(), this.fb);

  readonly title = signal('Bank/Cash Setup');

  private fillFormEffect = effect(() => {
    const bankCash = this.selectedBankCash();
    if (bankCash) {
      this.form.patchValue(bankCash);
      this.loading = false;
    }
  });

  ngOnInit(): void {
    const lastSegment = this.route.snapshot.url[this.route.snapshot.url.length - 1]?.path;

    if (lastSegment === 'create') {
      this.mode = 'create';
      this.successAction.set(bankCashActions.createBankCashSuccess);
      this.loading = false;
    } else if (lastSegment === 'edit') {
      this.itemId.set(this.route.snapshot.paramMap.get('id') || null);
      if(this.itemId()) {
        this.successAction.set(bankCashActions.updateBankCashSuccess);
        this.mode = 'edit';
        this.loading = true;
        this.store.dispatch(bankCashActions.loadBankCashById({ id: this.itemId()! }));
      }else{
        this.loading = false;
      }
    }
    
  }

  onDestroy() {
    this.fillFormEffect.destroy();
  }

  handleSubmit(data: BankCashCU) {

    const validatedFields = FormValidator.validate(data as any, this.formFields());
    const hasErrors = validatedFields.some(fld => fld.errors?.length);
    if (hasErrors) {
      this.formFields.set(validatedFields);
      return;
    }
    if(this.mode === 'create') {
      this.store.dispatch(bankCashActions.createBankCash({ bankCash: data }));
    }else{
      this.store.dispatch(bankCashActions.updateBankCash({ id: this.itemId()!, bankCash: data }));
    }
  }
}
