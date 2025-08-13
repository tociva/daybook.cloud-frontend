import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { FormUtil } from '../../../../../../util/form/form.util';
import { willPassRequiredValidation } from '../../../../../../util/form/validation.uti';
import { FormField } from '../../../../../../util/types/form-field.model';
import { TwoColumnFormComponent } from '../../../../../shared/forms/two-column-form/two-column-form.component';
import { bankCashActions, BankCashCU } from '../../../store/bank-cash';
import { FormValidator } from '../../../../../../util/form/form-validator';
import { Store } from '@ngrx/store';

@Component({
  selector: 'app-create-bank-cash',
  imports: [TwoColumnFormComponent],
  templateUrl: './create-bank-cash.html',
  styleUrl: './create-bank-cash.css'
})
export class CreateBankCash {

  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);

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

  handleSubmit(data: BankCashCU) {

    const validatedFields = FormValidator.validate(data as any, this.formFields());
    const hasErrors = validatedFields.some(fld => fld.errors?.length);
    if (hasErrors) {
      this.formFields.set(validatedFields);
      return;
    }
    this.store.dispatch(bankCashActions.createBankCash({ bankCash: data }));
  }
}
