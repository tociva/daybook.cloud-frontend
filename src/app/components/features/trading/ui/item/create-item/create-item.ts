import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionCreator, Store } from '@ngrx/store';
import { buildFormKey } from '../../../../../../util/common.util';
import { FormValidator } from '../../../../../../util/form/form-validator';
import { FormUtil } from '../../../../../../util/form/form.util';
import { willPassRequiredStringValidation } from '../../../../../../util/form/validation.uti';
import { WithFormDraftBinding } from '../../../../../../util/form/with-form-draft-binding';
import { FormField } from '../../../../../../util/types/form-field.model';
import { TwoColumnFormComponent } from '../../../../../shared/forms/two-column-form/two-column-form.component';
import { ItemNotFound } from '../../../../../shared/item-not-found/item-not-found';
import { SkeltonLoader } from '../../../../../shared/skelton-loader/skelton-loader';
import { Item, itemActions, ItemCU, ItemStore } from '../../../store/item';
import { ItemCategory, itemCategoryActions, ItemCategoryStore } from '../../../store/item-category';
import { CreateItemCategory } from '../../item-category/create-item-category/create-item-category';

const itemTypes = [
  'Product',
  'Service'
];
@Component({
  selector: 'app-create-item',
  imports: [TwoColumnFormComponent, SkeltonLoader, ItemNotFound],
  templateUrl: './create-item.html',
  styleUrl: './create-item.css'
})
export class CreateItem extends WithFormDraftBinding implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  readonly itemStore = inject(ItemStore);
  readonly itemCategoryStore = inject(ItemCategoryStore);
  readonly selectedItem = this.itemStore.selectedItem;
  successAction = signal<ActionCreator[] | ActionCreator | null>(null);
  failureAction = signal<ActionCreator[] | ActionCreator | null>(null);
  protected loading = true;
  protected readonly mode = signal<'create' | 'edit'>('create');
  private itemId = signal<string | null>(null);
  private router = inject(Router);
  readonly formKey = computed(() => buildFormKey('item', this.mode(), this.itemId()));

  
  categories = this.itemCategoryStore.items;
  items = computed(() => [
    { id: 'Add New Category', name: 'Add New Category' },
    ...this.categories()
  ]);
  typeOptions = signal(itemTypes);
  readonly formFields = signal<FormField[]>([
    { key: 'name', label: 'Name', type: 'text', required: true, group: 'Basic Details', validators:(value: unknown) => {
      if(!willPassRequiredStringValidation(value as string)) {
        return ['Name is required'];
      }
      return [];
    }},
    { key: 'category', label: 'Category', type: 'auto-complete', required: false, group: 'Basic Details',
      placeholder: 'Search for a category',
      autoComplete: {
        items: this.items,
        optionDisplayValue: (item: ItemCategory) => item.id === 'Add New Category' ? `\u271A ${item.name}` : item.name,
        inputDisplayValue: (item: ItemCategory) => item.name,
        trackBy: (item: ItemCategory) => item.id!,
        onSearch: (value: string) => {
          this.store.dispatch(itemCategoryActions.loadItemCategories({ query: { search: { query: value, fields: ['name', 'code', 'description'] } } }));
        },
        onOptionSelected: (item: ItemCategory) => {
          if(item.id === 'Add New Category') {
            this.form.patchValue({category: null, code: ''});
            const burl = this.router.url;
            this.router.navigate(['/trading/item-category/create'], { queryParams: { burl } });
          }else{
            this.form.patchValue({ category: item, code: item.code});
          }
        }
      }
    },
    { key: 'code', label: 'Code', type: 'text', required: true, group: 'Basic Details', validators:(value: unknown) => {
      if(!willPassRequiredStringValidation(value as string)) {
        return ['Code is required'];
      }
      return [];
    }},
    { key: 'displayname', label: 'Display Name', type: 'text', required: true, group: 'Basic Details', validators:(value: unknown) => {
      if(!willPassRequiredStringValidation(value as string)) {
        return ['Display name is required'];
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
    { key: 'barcode', label: 'Barcode', type: 'text', required: false, group: 'Basic Details'},
    { key: 'description', label: 'Description', type: 'text', required: false, group: 'Basic Details'},
    
    { key: 'purchaseledger', label: 'Purchase Ledger', type: 'text', required: false, group: 'Category & Ledger Details'},
    { key: 'salesledger', label: 'Sales Ledger', type: 'text', required: false, group: 'Category & Ledger Details'},
  ]);

  readonly form: FormGroup = FormUtil.buildForm(this.formFields(), this.fb);

  readonly title = signal('Item Setup');

  private loadErrorEffect = effect(() => {
    const error = this.itemStore.error();
    if (error && this.mode() === 'edit') {
      this.loading = false;
    }
  });
  
  private readonly binder = this.bindFormToDraft<Item>(
    this.form,
    this.formKey,
    {
      selected: this.selectedItem,
      persistIf: (form, v) => form.dirty && !!v,
      preHydrate: ({ value, draftStore }) => {
        const category = draftStore.consumeOneTimeDraft<ItemCategory, Item>(CreateItemCategory.ONE_TIME_DRAFT_KEY  );
        return category ? { ...value, category } : value;
      },
    }
  );
  
  ngOnInit(): void {
    const lastSegment = this.route.snapshot.url[this.route.snapshot.url.length - 1]?.path;

    if (lastSegment === 'create') {
      this.mode.set('create');
      this.successAction.set(itemActions.createItemSuccess);
      this.failureAction.set(itemActions.createItemFailure);
      this.loading = false;
    } else if (lastSegment === 'edit') {
      this.itemId.set(this.route.snapshot.paramMap.get('id') || null);
      if(this.itemId()) {
        this.successAction.set(itemActions.updateItemSuccess);
        this.mode.set('edit');
        this.loading = true;
        this.store.dispatch(itemActions.loadItemById({ id: this.itemId()!, query: { includes: ['category'] } }));
      }else{
        this.loading = false;
      }
    }
  }

  onDestroy() {
    this.loadErrorEffect.destroy();
  }

  handleSubmit = (dataP: Item) => {
    const validatedFields = FormValidator.validate(dataP as any, this.formFields());
    const hasErrors = validatedFields.some(fld => fld.errors?.length);
    if (hasErrors) {
      this.formFields.set(validatedFields);
      return;
    }

    const {category, purchaseledger, salesledger,barcode, description, ...data} = dataP;

    const item: ItemCU = {
      ...data,
      categoryid: category.id!,
      ...(purchaseledger && { purchaseledger }),
      ...(salesledger && { salesledger }),
      ...(barcode && { barcode }),
      ...(description && { description }),
    };

    if(this.mode() === 'create') {
      this.store.dispatch(itemActions.createItem({ item }));
    }else{
      this.store.dispatch(itemActions.updateItem({ id: this.itemId()!, item }));
    }
    this.binder.clear();

  }
}
