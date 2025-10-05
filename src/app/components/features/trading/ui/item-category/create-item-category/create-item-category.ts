import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ActionCreator, Store } from '@ngrx/store';
import { FormValidator } from '../../../../../../util/form/form-validator';
import { FormUtil } from '../../../../../../util/form/form.util';
import { willPassRequiredStringValidation } from '../../../../../../util/form/validation.uti';
import { FormField } from '../../../../../../util/types/form-field.model';
import { TwoColumnFormComponent } from '../../../../../shared/forms/two-column-form/two-column-form.component';
import { ItemNotFound } from '../../../../../shared/item-not-found/item-not-found';
import { SkeltonLoader } from '../../../../../shared/skelton-loader/skelton-loader';
import { itemCategoryActions, ItemCategoryStore } from '../../../store/item-category';
import { ItemCategory, ItemCategoryCU } from '../../../store/item-category/item-category.model';
import { WithFormDraftBinding } from '../../../../../../util/form/with-form-draft-binding';
import { buildFormKey } from '../../../../../../util/common.util';
import { TaxGroup } from '../../../store/tax-group/tax-group.model';
import { taxGroupActions, TaxGroupStore } from '../../../store/tax-group';

const itemTypes = [
  'Product',
  'Service'
];
@Component({
  selector: 'app-create-item-category',
  imports: [TwoColumnFormComponent, SkeltonLoader, ItemNotFound],
  templateUrl: './create-item-category.html',
  styleUrl: './create-item-category.css'
})
export class CreateItemCategory extends WithFormDraftBinding implements OnInit {

  public static readonly ONE_TIME_DRAFT_KEY = 'ONE_TIME_DRAFT_KEY_ITEM_CATEGORY';

  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  readonly itemCategoryStore = inject(ItemCategoryStore);
  readonly taxGroupStore = inject(TaxGroupStore);
  readonly selectedItemCategory = this.itemCategoryStore.selectedItem;
  successAction = signal<ActionCreator[] | ActionCreator | null>(null);
  protected loading = true;
  protected readonly mode = signal<'create' | 'edit'>('create');
  private itemId = signal<string | null>(null);
  readonly formKey = computed(() => buildFormKey('item-category', this.mode(), this.itemId()));
  readonly taxGroups = this.taxGroupStore.items;

  categories = this.itemCategoryStore.items;
  typeOptions = signal(itemTypes);
  
  readonly formFields = signal<FormField[]>([
    { key: 'name', label: 'Name', type: 'text', required: true, group: 'Basic Details', validators:(value: unknown) => {
      if(!willPassRequiredStringValidation(value as string)) {
        return ['Name is required'];
      }
      return [];
    }},
    { key: 'type', label: 'Type', type: 'auto-complete', required: true, group: 'Basic Details', 
      autoComplete: {
        items: this.typeOptions,
        optionDisplayValue: (item: string) => item,
        inputDisplayValue: (item: string) => item,
        trackBy: (item: string) => item,
        onSearch: (value: string) => {
          this.typeOptions.set(itemTypes.filter(type => type.toLowerCase().includes(value.toLowerCase())));
        },
      },
      validators:(value: unknown) => {
        if(!willPassRequiredStringValidation(value as string)) {
          return ['Type is required'];
        }
        return [];
      }
    },
    { key: 'code', label: 'Code', type: 'text', required: true, group: 'Basic Details', validators:(value: unknown) => {
      if(!willPassRequiredStringValidation(value as string)) {
        return ['Code is required'];
      }
      return [];
    }},
    { key: 'parent', label: 'Parent Category', type: 'auto-complete', required: false, group: 'Basic Details',
      placeholder: 'Search for a parent category',
      autoComplete: {
        items: this.categories,
        optionDisplayValue: (item: ItemCategory) => item.name,
        inputDisplayValue: (item: ItemCategory) => item.name,
        trackBy: (item: ItemCategory) => item.id!,
        onSearch: (value: string) => {
          this.store.dispatch(itemCategoryActions.loadItemCategories({ query: { search: { query: value, fields: ['name', 'code', 'description'] } } }));
        },
      }
    },
    { key: 'description', label: 'Description', type: 'text', required: false, group: 'Basic Details'},
    { key: 'taxgroup', label: 'Tax Group', type: 'auto-complete', required: false, group: 'Basic Details',
      placeholder: 'Search for a tax group',
      autoComplete: {
        items: this.taxGroups,
        optionDisplayValue: (item: TaxGroup) => item.name,
        inputDisplayValue: (item: TaxGroup) => item.name,
        trackBy: (item: TaxGroup) => item.id!,
        onSearch: (value: string) => {
          this.store.dispatch(taxGroupActions.loadTaxGroups({ query: { search: { query: value, fields: ['name', 'description'] } } }));
        },
      }
    }
  ]);

  readonly form: FormGroup = FormUtil.buildForm(this.formFields(), this.fb);

  readonly title = signal('Item Category Setup');

  private fillFormEffect = effect(() => {
    const itemCategory = this.selectedItemCategory();
    if (itemCategory) {
      this.form.patchValue(itemCategory);
      this.loading = false;
    }
  });

  private loadErrorEffect = effect(() => {
    const error = this.itemCategoryStore.error();
    if (error && this.mode() === 'edit') {
      this.loading = false;
    }
  });

  private readonly binder = this.bindFormToDraft<ItemCategory>(
    this.form,
    this.formKey,
    {
      selected: this.selectedItemCategory,
      persistIf: (form, v) => form.dirty && !!v,
    }
  );

  ngOnInit(): void {
    const lastSegment = this.route.snapshot.url[this.route.snapshot.url.length - 1]?.path;

    if (lastSegment === 'create') {
      this.mode.set('create');
      this.successAction.set(itemCategoryActions.createItemCategorySuccess);
      this.loading = false;
    } else if (lastSegment === 'edit') {
      this.itemId.set(this.route.snapshot.paramMap.get('id') || null);
      if(this.itemId()) {
        this.successAction.set(itemCategoryActions.updateItemCategorySuccess);
        this.mode.set('edit');
        this.loading = true;
        this.store.dispatch(itemCategoryActions.loadItemCategoryById({ id: this.itemId()!, query: { includes: ['parent'] } }));
      }else{
        this.loading = false;
      }
    }
  }

  onDestroy() {
    this.fillFormEffect.destroy();
    this.loadErrorEffect.destroy();
  }

  handleSubmit = (dataP: ItemCategory) => {
    const validatedFields = FormValidator.validate(dataP as any, this.formFields());
    const hasErrors = validatedFields.some(fld => fld.errors?.length);
    if (hasErrors) {
      this.formFields.set(validatedFields);
      return;
    }

    const { parent,description, taxgroup, ...data } = dataP;

    const itemCategory: ItemCategoryCU = {
      ...data,
      ...(description && { description }),
      ...(taxgroup && { taxgroupid: taxgroup.id }),
    };
    if(this.mode() === 'create') {
      this.draftStore.setOneTimeDraft(CreateItemCategory.ONE_TIME_DRAFT_KEY, itemCategory);
      this.store.dispatch(itemCategoryActions.createItemCategory({ itemCategory }));
    }else{
      this.store.dispatch(itemCategoryActions.updateItemCategory({ id: this.itemId()!, itemCategory }));
    }
    this.binder.clear();
  }
}
