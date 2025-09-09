import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { WithFormDraftBinding } from '../../../../../../util/form/with-form-draft-binding';
import { TwoColumnFormComponent } from '../../../../../shared/forms/two-column-form/two-column-form.component';
import { SkeltonLoader } from '../../../../../shared/skelton-loader/skelton-loader';
import { ItemNotFound } from '../../../../../shared/item-not-found/item-not-found';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActionCreator, Store } from '@ngrx/store';
import { ActivatedRoute } from '@angular/router';
import { LedgerCategory, ledgerCategoryActions, LedgerCategoryCU, LedgerCategoryStore, LedgerCategoryType } from '../../../store/ledger-category';
import { buildFormKey } from '../../../../../../util/common.util';
import { FormField } from '../../../../../../util/types/form-field.model';
import { willPassRequiredStringValidation } from '../../../../../../util/form/validation.uti';
import { FormUtil } from '../../../../../../util/form/form.util';
import { FormValidator } from '../../../../../../util/form/form-validator';

@Component({
  selector: 'app-create-ledger-category',
  imports: [TwoColumnFormComponent, SkeltonLoader, ItemNotFound],
  templateUrl: './create-ledger-category.html',
  styleUrl: './create-ledger-category.css'
})
export class CreateLedgerCategory extends WithFormDraftBinding implements OnInit {

  public static readonly ONE_TIME_DRAFT_KEY = 'ONE_TIME_DRAFT_KEY_LEDGER_CATEGORY';

  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  readonly ledgerCategoryStore = inject(LedgerCategoryStore);
  readonly selectedLedgerCategory = this.ledgerCategoryStore.selectedItem;
  successAction = signal<ActionCreator[] | ActionCreator | null>(null);
  protected loading = true;
  protected readonly mode = signal<'create' | 'edit'>('create');
  private itemId = signal<string | null>(null);
  readonly formKey = computed(() => buildFormKey('ledger-category', this.mode(), this.itemId()));

  categories = this.ledgerCategoryStore.items;

  categoryTypes = Object.values(LedgerCategoryType);
  typeOptions = signal(this.categoryTypes);

  readonly formFields = signal<FormField[]>([
    { key: 'name', label: 'Name', type: 'text', required: true, group: 'Basic Details', validators:(value: unknown) => {
      if(!willPassRequiredStringValidation(value as string)) {
        return ['Name is required'];
      }
      return [];
    }},
    { key: 'props.type', label: 'Type', type: 'auto-complete', required: false, group: 'Basic Details',
      autoComplete: {
        items: this.typeOptions,
        optionDisplayValue: (item: string) => item,
        inputDisplayValue: (item: string) => item,
        trackBy: (item: string) => item,
        onSearch: (value: string) => {
          this.typeOptions.set(this.categoryTypes.filter(type => type.toLowerCase().includes(value.toLowerCase())));
        },
      },
      validators:(value: unknown) => {
      if(value as string && !willPassRequiredStringValidation(value as string)) {
        return ['Invalid type'];
      }
      return [];
    }},
    { key: 'parent', label: 'Parent Category', type: 'auto-complete', required: false, group: 'Basic Details',
      placeholder: 'Search for a parent category',
      autoComplete: {
        items: this.categories,
        optionDisplayValue: (item: LedgerCategory) => item.name,
        inputDisplayValue: (item: LedgerCategory) => item.name,
        trackBy: (item: LedgerCategory) => item.id!,
        onSearch: (value: string) => {
          this.store.dispatch(ledgerCategoryActions.loadLedgerCategories({ query: { search: { query: value, fields: ['name', 'description'] } } }));
        },
      }
    },
    { key: 'description', label: 'Description', type: 'text', required: false, group: 'Basic Details'},

  ]);

  readonly form: FormGroup = FormUtil.buildForm(this.formFields(), this.fb);

  readonly title = signal('Item Category Setup');

  private fillFormEffect = effect(() => {
    const ledgerCategory = this.selectedLedgerCategory();
    if (ledgerCategory) {
      this.form.patchValue(ledgerCategory);
      this.loading = false;
    }
  });

  private loadErrorEffect = effect(() => {
    const error = this.ledgerCategoryStore.error();
    if (error && this.mode() === 'edit') {
      this.loading = false;
    }
  });

  private readonly binder = this.bindFormToDraft<LedgerCategory>(
    this.form,
    this.formKey,
    {
      selected: this.selectedLedgerCategory,
      persistIf: (form, v) => form.dirty && !!v,
    }
  );

  ngOnInit(): void {
    const lastSegment = this.route.snapshot.url[this.route.snapshot.url.length - 1]?.path;

    if (lastSegment === 'create') {
      this.mode.set('create');
      this.successAction.set(ledgerCategoryActions.createLedgerCategorySuccess);
      this.loading = false;
    } else if (lastSegment === 'edit') {
      this.itemId.set(this.route.snapshot.paramMap.get('id') || null);
      if(this.itemId()) {
        this.successAction.set(ledgerCategoryActions.updateLedgerCategorySuccess);
        this.mode.set('edit');
        this.loading = true;
        this.store.dispatch(ledgerCategoryActions.loadLedgerCategoryById({ id: this.itemId()!, query: { includes: ['parent'] } }));
      }else{
        this.loading = false;
      }
    }
  }

  onDestroy() {
    this.fillFormEffect.destroy();
    this.loadErrorEffect.destroy();
  }

  handleSubmit = (dataP: LedgerCategory) => {
    const validatedFields = FormValidator.validate(dataP as any, this.formFields());
    const hasErrors = validatedFields.some(fld => fld.errors?.length);
    if (hasErrors) {
      this.formFields.set(validatedFields);
      return;
    }

    const { name, props, parent, description } = dataP;

    const ledgerCategory: LedgerCategoryCU = {
      name,
      ...(description && { description }),
      ...(parent && { parentid: parent.id }),
      ...(props && { props }),
    };
    if(this.mode() === 'create') {
      this.draftStore.setOneTimeDraft(CreateLedgerCategory.ONE_TIME_DRAFT_KEY, ledgerCategory);
      this.store.dispatch(ledgerCategoryActions.createLedgerCategory({ ledgerCategory }));
    }else{
      this.store.dispatch(ledgerCategoryActions.updateLedgerCategory({ id: this.itemId()!, ledgerCategory }));
    }
    this.binder.clear();
  }
}
