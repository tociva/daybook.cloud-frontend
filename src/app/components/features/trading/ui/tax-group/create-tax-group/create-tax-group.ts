import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionCreator, Store } from '@ngrx/store';
import { buildFormKey } from '../../../../../../util/common.util';
import { FormUtil } from '../../../../../../util/form/form.util';
import { willPassRequiredStringValidation } from '../../../../../../util/form/validation.uti';
import { WithFormDraftBinding } from '../../../../../../util/form/with-form-draft-binding';
import { FormField } from '../../../../../../util/types/form-field.model';
import { TwoColumnFormComponent } from '../../../../../shared/forms/two-column-form/two-column-form.component';
import { ItemNotFound } from '../../../../../shared/item-not-found/item-not-found';
import { SkeltonLoader } from '../../../../../shared/skelton-loader/skelton-loader';
import { taxActions, TaxStore } from '../../../store/tax';
import { taxGroupActions, TaxGroupStore } from '../../../store/tax-group';
import { TaxGroup, TaxGroupCU } from '../../../store/tax-group/tax-group.model';

@Component({
  selector: 'app-create-tax-group',
  imports: [TwoColumnFormComponent, SkeltonLoader, ItemNotFound],
  templateUrl: './create-tax-group.html',
  styleUrl: './create-tax-group.css'
})
export class CreateTaxGroup extends WithFormDraftBinding implements OnInit {

  public static readonly ONE_TIME_DRAFT_KEY = 'ONE_TIME_DRAFT_KEY_TAX_GROUP'

  private readonly fb = inject(FormBuilder)
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  readonly taxGroupStore = inject(TaxGroupStore);
  readonly taxStore = inject(TaxStore);
  readonly selectedTaxGroup = this.taxGroupStore.selectedItem;
  successAction = signal<ActionCreator[] | ActionCreator | null>(null);
  failureAction = signal<ActionCreator[] | ActionCreator | null>(null);
  protected loading = true;
  protected readonly mode = signal<'create' | 'edit'>('create');
  private taxGroupId = signal<string | null>(null);
  private router = inject(Router);
  readonly formKey = computed(() => buildFormKey('tax-group', this.mode(), this.taxGroupId()));

  taxes = this.taxStore.items;

  readonly formFields = signal<FormField[]>([
    { key: 'name', label: 'Name', type: 'text', required: true, group: 'Basic Details', validators:(value: unknown) => {
      if(!willPassRequiredStringValidation(value as string)) {
        return ['Name is required'];
      }
      return [];
    }},
    { key: 'rate', label: 'Rate (%)', type: 'number', required: true, group: 'Basic Details', validators:(value: unknown) => {
      if(!value || isNaN(Number(value)) || Number(value) < 0) {
        return ['Rate is required and must be a positive number'];
      }
      return [];
    }},
    { key: 'description', label: 'Description', type: 'text', required: false, group: 'Basic Details'},
    
  ]);

  readonly form: FormGroup = FormUtil.buildForm(this.formFields(), this.fb);

  readonly title = signal('Tax Group Setup');

  private fillFormEffect = effect(() => {
    const taxGroup = this.selectedTaxGroup();
    if (taxGroup) {
      this.form.patchValue(taxGroup);
      this.loading = false;
    }
  });

  private loadErrorEffect = effect(() => {
    const error = this.taxGroupStore.error();
    if (error && this.mode() === 'edit') {
      this.loading = false;
    }
  });

  private readonly binder = this.bindFormToDraft<TaxGroup>(
    this.form,
    this.formKey,
    {
      selected: this.selectedTaxGroup,
      persistIf: (form, v) => form.dirty && !!v,
    }
  );

  ngOnInit(): void {
    const lastSegment = this.route.snapshot.url[this.route.snapshot.url.length - 1]?.path;
    const id = this.route.snapshot.paramMap.get('id');
    
    if (lastSegment === 'create') {
      this.mode.set('create');
      this.successAction.set(taxGroupActions.createTaxGroupSuccess);
      this.failureAction.set(taxGroupActions.createTaxGroupFailure);
      this.loading = false;
    } else if (lastSegment === 'edit' && id) {
      this.mode.set('edit');
      this.taxGroupId.set(id);
      this.successAction.set(taxGroupActions.updateTaxGroupSuccess);
      this.failureAction.set(taxGroupActions.updateTaxGroupFailure);
      this.loading = true;
      this.store.dispatch(taxGroupActions.loadTaxGroupById({ id }));
    } else if (lastSegment === 'view' && id) {
      this.mode.set('edit');
      this.taxGroupId.set(id);
      this.loading = true;
      this.store.dispatch(taxGroupActions.loadTaxGroupById({ id }));
    }

    // Load taxes for the tax group selector
    this.store.dispatch(taxActions.loadTaxes({}));
  }

  handleSubmit(formData: TaxGroupCU): void {
    if (this.mode() === 'create') {
      this.store.dispatch(taxGroupActions.createTaxGroup({ taxGroup: formData }));
    } else if (this.mode() === 'edit' && this.taxGroupId()) {
      this.store.dispatch(taxGroupActions.updateTaxGroup({ 
        id: this.taxGroupId()!, 
        taxGroup: formData 
      }));
    }
  }
}
