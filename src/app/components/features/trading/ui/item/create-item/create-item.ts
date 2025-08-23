import { Component, effect, inject, OnInit, signal } from '@angular/core';
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
import { Item, itemActions, ItemCU, ItemStore } from '../../../store/item';
import { itemCategoryActions, ItemCategory, ItemCategoryStore } from '../../../store/item-category';

@Component({
  selector: 'app-create-item',
  imports: [TwoColumnFormComponent, SkeltonLoader, ItemNotFound],
  templateUrl: './create-item.html',
  styleUrl: './create-item.css'
})
export class CreateItem implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  readonly itemStore = inject(ItemStore);
  readonly itemCategoryStore = inject(ItemCategoryStore);
  readonly selectedItem = this.itemStore.selectedItem;
  successAction = signal<ActionCreator[] | ActionCreator | null>(null);
  protected loading = true;
  protected mode:'create'|'edit' = 'create';
  private itemId = signal<string | null>(null);

  categories = this.itemCategoryStore.items;

  readonly formFields = signal<FormField[]>([
    // 🟦 Basic Details
    { key: 'name', label: 'Name', type: 'text', required: true, group: 'Basic Details', validators:(value: unknown) => {
      if(!willPassRequiredStringValidation(value as string)) {
        return ['Name is required'];
      }
      return [];
    }},
    { key: 'category', label: 'Category', type: 'auto-complete', required: false, group: 'Basic Details',
      placeholder: 'Search for a category',
      autoComplete: {
        items: this.categories,
        optionDisplayValue: (item: ItemCategory) => item.name,
        inputDisplayValue: (item: ItemCategory) => item.name,
        trackBy: (item: ItemCategory) => item.id!,
        onSearch: (value: string) => {
          this.store.dispatch(itemCategoryActions.loadItemCategories({ query: { search: { query: value, fields: ['name', 'code', 'description'] } } }));
        },
        onOptionSelected: (item: ItemCategory) => {
          this.form.patchValue({ code: item.code});
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
    { key: 'type', label: 'Type', type: 'select', required: true, group: 'Basic Details', 
      options: [
        { value: 'Product', label: 'Product' },
        { value: 'Service', label: 'Service' }
      ],
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

  private fillFormEffect = effect(() => {
    const item = this.selectedItem();
    if (item) {
      this.form.patchValue(item);
      this.loading = false;
    }
  });

  private loadErrorEffect = effect(() => {
    const error = this.itemStore.error();
    if (error && this.mode === 'edit') {
      this.loading = false;
    }
  });

  ngOnInit(): void {
    const lastSegment = this.route.snapshot.url[this.route.snapshot.url.length - 1]?.path;

    if (lastSegment === 'create') {
      this.mode = 'create';
      this.successAction.set(itemActions.createItemSuccess);
      this.loading = false;
    } else if (lastSegment === 'edit') {
      this.itemId.set(this.route.snapshot.paramMap.get('id') || null);
      if(this.itemId()) {
        this.successAction.set(itemActions.updateItemSuccess);
        this.mode = 'edit';
        this.loading = true;
        this.store.dispatch(itemActions.loadItemById({ id: this.itemId()!, query: { includes: ['category'] } }));
      }else{
        this.loading = false;
      }
    }
  }

  onDestroy() {
    this.fillFormEffect.destroy();
    this.loadErrorEffect.destroy();
  }

  handleSubmit = (dataP: Item) => {
    const validatedFields = FormValidator.validate(dataP as any, this.formFields());
    const hasErrors = validatedFields.some(fld => fld.errors?.length);
    if (hasErrors) {
      this.formFields.set(validatedFields);
      return;
    }

    const {category, purchaseledger, salesledger, ...data} = dataP;

    const item:ItemCU = {
      ...data,
      categoryid: category.id!,
      purchaseledger: purchaseledger ?? '',
      salesledger: salesledger ?? '',
    };

    if(this.mode === 'create') {
      this.store.dispatch(itemActions.createItem({ item }));
    }else{
      this.store.dispatch(itemActions.updateItem({ id: this.itemId()!, item }));
    }
  }
}
