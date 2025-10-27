import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionCreator, Store } from '@ngrx/store';
import { WithFormDraftBinding } from '../../../../../../util/form/with-form-draft-binding';
import { TwoColumnFormComponent } from '../../../../../shared/forms/two-column-form/two-column-form.component';
import { SkeltonLoader } from '../../../../../shared/skelton-loader/skelton-loader';
import { Ledger, ledgerActions, LedgerCU, LedgerStore } from '../../../store/ledger';
import { LedgerCategory, ledgerCategoryActions, LedgerCategoryStore } from '../../../store/ledger-category';
import { buildFormKey } from '../../../../../../util/common.util';
import { FormField } from '../../../../../../util/types/form-field.model';
import { willPassRequiredStringValidation } from '../../../../../../util/form/validation.uti';
import { FormUtil } from '../../../../../../util/form/form.util';
import { CreateLedgerCategory } from '../../ledger-category/create-ledger-category/create-ledger-category';
import { FormValidator } from '../../../../../../util/form/form-validator';
import { ItemNotFound } from '../../../../../shared/item-not-found/item-not-found';

@Component({
  selector: 'app-create-ledger',
  imports: [TwoColumnFormComponent, SkeltonLoader, ItemNotFound],
  templateUrl: './create-ledger.html',
  styleUrl: './create-ledger.css'
})
export class CreateLedger extends WithFormDraftBinding implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  readonly ledgerStore = inject(LedgerStore);
  readonly ledgerCategoryStore = inject(LedgerCategoryStore);
  readonly selectedLedger = this.ledgerStore.selectedItem;
  successAction = signal<ActionCreator[] | ActionCreator | null>(null);
  failureAction = signal<ActionCreator[] | ActionCreator | null>(null);
  protected loading = true;
  protected readonly mode = signal<'create' | 'edit'>('create');
  private itemId = signal<string | null>(null);
  private router = inject(Router);
  readonly formKey = computed(() => buildFormKey('ledger', this.mode(), this.itemId()));

  
  categories = this.ledgerCategoryStore.items;
  items = computed(() => [
    { id: 'Add New Category', name: 'Add New Category' },
    ...this.categories()
  ]);
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
        optionDisplayValue: (item: LedgerCategory) => item.id === 'Add New Category' ? `\u271A ${item.name}` : item.name,
        inputDisplayValue: (item: LedgerCategory) => item.name,
        trackBy: (item: LedgerCategory) => item.id!,
        onSearch: (value: string) => {
          this.store.dispatch(ledgerCategoryActions.loadLedgerCategories({ query: { search: { query: value, fields: ['name', 'description'] } } }));
        },
        onOptionSelected: (item: LedgerCategory) => {
          if(item.id === 'Add New Category') {
            this.form.patchValue({category: null});
            const burl = this.router.url;
            this.router.navigate(['/app/trading/item-category/create'], { queryParams: { burl } });
          }
        }
      }
    },
    { key: 'description', label: 'Description', type: 'text', required: false, group: 'Basic Details'},
    { key: 'openingdr', label: 'Opening DR', type: 'number', required: false, group: 'Opening Balances Details'},
    { key: 'openingcr', label: 'Opening CR', type: 'number', required: false, group: 'Opening Balances Details'},
  ]);

  readonly form: FormGroup = FormUtil.buildForm(this.formFields(), this.fb);

  readonly title = signal('Ledger Setup');

  private fillFormEffect = effect(() => {
    const ledger = this.selectedLedger();
    if (ledger) {
      this.form.patchValue(ledger);
      this.loading = false;
    }
  });

  private loadErrorEffect = effect(() => {
    const error = this.ledgerStore.error();
    if (error && this.mode() === 'edit') {
      this.loading = false;
    }
  });
  
  private readonly binder = this.bindFormToDraft<Ledger>(
    this.form,
    this.formKey,
    {
      selected: this.selectedLedger,
      persistIf: (form, v) => form.dirty && !!v,
      preHydrate: ({ value, draftStore }) => {
        const category = draftStore.consumeOneTimeDraft<LedgerCategory, Ledger>(CreateLedgerCategory.ONE_TIME_DRAFT_KEY  );
        return category ? { ...value, category } : value;
      },
    }
  );
  
  ngOnInit(): void {
    const lastSegment = this.route.snapshot.url[this.route.snapshot.url.length - 1]?.path;

    if (lastSegment === 'create') {
      this.mode.set('create');
      this.successAction.set(ledgerActions.createLedgerSuccess);
      this.failureAction.set(ledgerActions.createLedgerFailure);
      this.loading = false;
    } else if (lastSegment === 'edit') {
      this.itemId.set(this.route.snapshot.paramMap.get('id') || null);
      if(this.itemId()) {
        this.successAction.set(ledgerActions.updateLedgerSuccess);
        this.mode.set('edit');
        this.loading = true;
        this.store.dispatch(ledgerActions.loadLedgerById({ id: this.itemId()!, query: { includes: ['category'] } }));
      }else{
        this.loading = false;
      }
    }
  }

  ngOnDestroy() {
    this.fillFormEffect.destroy();
    this.loadErrorEffect.destroy();
  }

  handleSubmit = (dataP: Ledger) => {
    const validatedFields = FormValidator.validate(dataP as any, this.formFields());
    const hasErrors = validatedFields.some(fld => fld.errors?.length);
    if (hasErrors) {
      this.formFields.set(validatedFields);
      return;
    }

    const {category, description, openingdr, openingcr, name} = dataP;

    const ledger: LedgerCU = {
      name,
      categoryid: category.id!,
      ...(description && { description }),
      ...(openingdr && { openingdr: Number(openingdr) }),
      ...(openingcr && { openingcr: Number(openingcr) }),
    };

    if(this.mode() === 'create') {
      this.store.dispatch(ledgerActions.createLedger({ ledger }));
    }else{
      this.store.dispatch(ledgerActions.updateLedger({ id: this.itemId()!, ledger }));
    }
    this.binder.clear();

  }
}
