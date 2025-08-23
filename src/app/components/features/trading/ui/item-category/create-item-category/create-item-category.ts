import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { FormUtil } from '../../../../../../util/form/form.util';
import { willPassRequiredStringValidation } from '../../../../../../util/form/validation.uti';
import { FormField } from '../../../../../../util/types/form-field.model';
import { TwoColumnFormComponent } from '../../../../../shared/forms/two-column-form/two-column-form.component';
import { itemCategoryActions, ItemCategoryCU, ItemCategoryStore } from '../../../store/item-category';
import { FormValidator } from '../../../../../../util/form/form-validator';
import { ActionCreator, Store } from '@ngrx/store';
import { SkeltonLoader } from '../../../../../shared/skelton-loader/skelton-loader';
import { ActivatedRoute } from '@angular/router';
import { ItemNotFound } from '../../../../../shared/item-not-found/item-not-found';
import { ItemCategory } from '../../../store/item-category/item-category.model';

@Component({
  selector: 'app-create-item-category',
  imports: [TwoColumnFormComponent, SkeltonLoader, ItemNotFound],
  templateUrl: './create-item-category.html',
  styleUrl: './create-item-category.css'
})
export class CreateItemCategory implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  readonly itemCategoryStore = inject(ItemCategoryStore);
  readonly selectedItemCategory = this.itemCategoryStore.selectedItem;
  successAction = signal<ActionCreator[] | ActionCreator | null>(null);
  protected loading = true;
  protected mode:'create'|'edit' = 'create';
  private itemId = signal<string | null>(null);

  // Mock parent categories for now - in a real app, you'd load these from the store
  parentCategories = signal<ItemCategory[]>([
    { id: '1', name: 'Electronics', code: 'ELEC', description: 'Electronic items', branch: {} as any, branchid: '' },
    { id: '2', name: 'Clothing', code: 'CLOTH', description: 'Clothing items', branch: {} as any, branchid: '' },
    { id: '3', name: 'Books', code: 'BOOKS', description: 'Book items', branch: {} as any, branchid: '' },
  ]);

  readonly formFields = signal<FormField[]>([
    // 🟦 Basic Details
    { key: 'name', label: 'Name', type: 'text', required: true, group: 'Basic Details', validators:(value: unknown) => {
      if(!willPassRequiredStringValidation(value as string)) {
        return ['Name is required'];
      }
      return [];
    }},
    { key: 'code', label: 'Code', type: 'text', required: true, group: 'Basic Details', validators:(value: unknown) => {
      if(!willPassRequiredStringValidation(value as string)) {
        return ['Code is required'];
      }
      return [];
    }},
    { key: 'description', label: 'Description', type: 'text', required: false, group: 'Basic Details'},
    
    // 🟦 Parent Category
    { key: 'parentid', label: 'Parent Category', type: 'select', required: false, group: 'Parent Category',
      options: [
        { value: '', label: 'No Parent (Root Category)' },
        ...this.parentCategories().map(cat => ({ value: cat.id!, label: cat.name }))
      ]
    },
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
    if (error && this.mode === 'edit') {
      this.loading = false;
    }
  });

  ngOnInit(): void {
    const lastSegment = this.route.snapshot.url[this.route.snapshot.url.length - 1]?.path;

    if (lastSegment === 'create') {
      this.mode = 'create';
      this.successAction.set(itemCategoryActions.createItemCategorySuccess);
      this.loading = false;
    } else if (lastSegment === 'edit') {
      this.itemId.set(this.route.snapshot.paramMap.get('id') || null);
      if(this.itemId()) {
        this.successAction.set(itemCategoryActions.updateItemCategorySuccess);
        this.mode = 'edit';
        this.loading = true;
        this.store.dispatch(itemCategoryActions.loadItemCategoryById({ id: this.itemId()! }));
      }else{
        this.loading = false;
      }
    }
  }

  onDestroy() {
    this.fillFormEffect.destroy();
    this.loadErrorEffect.destroy();
  }

  handleSubmit = (data: ItemCategoryCU) => {
    const validatedFields = FormValidator.validate(data as any, this.formFields());
    const hasErrors = validatedFields.some(fld => fld.errors?.length);
    if (hasErrors) {
      this.formFields.set(validatedFields);
      return;
    }

    const itemCategory = {
      ...data,
      parentid: data.parentid || undefined // Remove empty string for parentid
    };

    if(this.mode === 'create') {
      this.store.dispatch(itemCategoryActions.createItemCategory({ itemCategory }));
    }else{
      this.store.dispatch(itemCategoryActions.updateItemCategory({ id: this.itemId()!, itemCategory }));
    }
  }
}
