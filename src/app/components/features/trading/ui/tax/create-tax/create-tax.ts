import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { FormUtil } from '../../../../../../util/form/form.util';
import { willPassRequiredNumberValidation, willPassRequiredStringValidation } from '../../../../../../util/form/validation.uti';
import { FormField } from '../../../../../../util/types/form-field.model';
import { TwoColumnFormComponent } from '../../../../../shared/forms/two-column-form/two-column-form.component';
import { taxActions, TaxCU, TaxStore } from '../../../store/tax';
import { FormValidator } from '../../../../../../util/form/form-validator';
import { ActionCreator, Store } from '@ngrx/store';
import { SkeltonLoader } from '../../../../../shared/skelton-loader/skelton-loader';
import { ActivatedRoute } from '@angular/router';
import { ItemNotFound } from '../../../../../shared/item-not-found/item-not-found';

@Component({
  selector: 'app-create-tax',
  imports: [TwoColumnFormComponent, SkeltonLoader, ItemNotFound],
  templateUrl: './create-tax.html',
  styleUrl: './create-tax.css'
})
export class CreateTax implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  readonly taxStore = inject(TaxStore);
  readonly selectedTax = this.taxStore.selectedItem;
  successAction = signal<ActionCreator[] | ActionCreator | null>(null);
  protected loading = true;
  protected mode:'create'|'edit' = 'create';
  private itemId = signal<string | null>(null);

  readonly formFields = signal<FormField[]>([
    // 🟦 Basic Details
    { key: 'name', label: 'Name', type: 'text', required: true, group: 'Basic Details', validators:(value: unknown) => {
      if(!willPassRequiredStringValidation(value as string)) {
        return ['Name is required'];
      }
      return [];
    }},
    { key: 'shortname', label: 'Short Name', type: 'text', required: true, group: 'Basic Details', validators:(value: unknown) => {
      if(!willPassRequiredStringValidation(value as string)) {
        return ['Short name is required'];
      }
      return [];
    }},
    { key: 'rate', label: 'Rate (%)', type: 'number', required: true, group: 'Basic Details', validators:(value: unknown) => {
      if(!willPassRequiredNumberValidation(value as number)) {
        return ['Rate is required'];
      }
      if (value as number < 0) {
        return ['Rate must be greater than or equal to 0'];
      }
      return [];
    }},
    { key: 'appliedto', label: 'Applied To', type: 'number', required: true, group: 'Basic Details', validators:(value: unknown) => {
      if(!willPassRequiredNumberValidation(value as number)) {
        return ['Applied to is required'];
      }
      if (value as number < 0) {
        return ['Applied to must be greater than or equal to 0'];
      }
      return [];
    }},
    { key: 'description', label: 'Description', type: 'text', required: false, group: 'Basic Details'},
  ]);

  readonly form: FormGroup = FormUtil.buildForm(this.formFields(), this.fb);

  readonly title = signal('Tax Setup');

  private fillFormEffect = effect(() => {
    const tax = this.selectedTax();
    if (tax) {
      this.form.patchValue(tax);
      this.loading = false;
    }
  });

  private loadErrorEffect = effect(() => {
    const error = this.taxStore.error();
    if (error && this.mode === 'edit') {
      this.loading = false;
    }
  });

  ngOnInit(): void {
    const lastSegment = this.route.snapshot.url[this.route.snapshot.url.length - 1]?.path;

    if (lastSegment === 'create') {
      this.mode = 'create';
      this.successAction.set(taxActions.createTaxSuccess);
      this.loading = false;
    } else if (lastSegment === 'edit') {
      this.itemId.set(this.route.snapshot.paramMap.get('id') || null);
      if(this.itemId()) {
        this.successAction.set(taxActions.updateTaxSuccess);
        this.mode = 'edit';
        this.loading = true;
        this.store.dispatch(taxActions.loadTaxById({ id: this.itemId()! }));
      }else{
        this.loading = false;
      }
    }
  }

  onDestroy() {
    this.fillFormEffect.destroy();
    this.loadErrorEffect.destroy();
  }

  handleSubmit = (data: TaxCU) => {
    const validatedFields = FormValidator.validate(data as any, this.formFields());
    const hasErrors = validatedFields.some(fld => fld.errors?.length);
    const {appliedto, rate, ...rest} = data;

    const tax = {
      ...rest,
      appliedto: Number(appliedto),
      rate: Number(rate)
    }
    if (hasErrors) {
      this.formFields.set(validatedFields);
      return;
    }
    if(this.mode === 'create') {
      this.store.dispatch(taxActions.createTax({ tax }));
    }else{
      this.store.dispatch(taxActions.updateTax({ id: this.itemId()!, tax }));
    }
  }
}
