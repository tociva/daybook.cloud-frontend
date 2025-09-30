import { NgClass } from '@angular/common';
import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionCreator, Store } from '@ngrx/store';
import { buildFormKey } from '../../../../../../util/common.util';
import { WithFormDraftBinding } from '../../../../../../util/form/with-form-draft-binding';
import { ItemNotFound } from '../../../../../shared/item-not-found/item-not-found';
import { SkeltonLoader } from '../../../../../shared/skelton-loader/skelton-loader';
import { taxActions, TaxStore } from '../../../store/tax';
import { taxGroupActions, TaxGroupStore } from '../../../store/tax-group';
import { TaxGroupCU } from '../../../store/tax-group/tax-group.model';
import { Tax } from '../../../store/tax/tax.model';
import { AutoComplete } from '../../../../../shared/auto-complete/auto-complete';
import { CancelButton } from '../../../../../shared/cancel-button/cancel-button';
import { Actions, ofType } from '@ngrx/effects';
import { tap } from 'rxjs';

type GroupForm = FormGroup<{
  mode: FormControl<string>;
  taxids: FormArray<FormControl<string>>;
  taxes: FormArray<FormControl<Tax>>;
  tax: FormControl<Tax>;
}>;
@Component({
  selector: 'app-create-tax-group',
  imports: [SkeltonLoader, ItemNotFound, NgClass, ReactiveFormsModule, AutoComplete, CancelButton],
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
  readonly actions$ = inject(Actions);
  successAction = signal<ActionCreator[] | ActionCreator | null>(null);
  failureAction = signal<ActionCreator[] | ActionCreator | null>(null);
  protected loading = true;
  protected readonly mode = signal<'create' | 'edit'>('create');
  private taxGroupId = signal<string | null>(null);
  private router = inject(Router);
  readonly formKey = computed(() => buildFormKey('tax-group', this.mode(), this.taxGroupId()));
  readonly submitting = signal(false);


  taxes = this.taxStore.items;
  readonly form: FormGroup;


  constructor() {
    super();
    this.form = this.fb.group({
      name: new FormControl<string | null>(null, {
        validators: [Validators.required],
        nonNullable: false,
      }),
      rate: new FormControl<number | null>(null, {
        validators: [Validators.required, Validators.min(0)],
        nonNullable: false,
      }),
      description: new FormControl<string | null>(null),
      groups: this.fb.array<GroupForm>([])
    });
  }

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

  readonly saveSuccessEffect = effect((onCleanup) => {
    const creators = this.successAction();
    if (!creators) return;

    // Normalize to array
    const creatorArray = Array.isArray(creators) ? creators : [creators];
    
    const subscription = this.actions$.pipe(
      ofType(...creatorArray),
      tap(() => {
        const burl = this.route.snapshot.queryParamMap.get('burl') ?? '/app/trading/tax-group';
        this.router.navigateByUrl(burl);
      })
    ).subscribe();

    onCleanup(() => subscription.unsubscribe());
  });

  readonly failureActionEffect = effect((onCleanup) => {
    const creators = this.failureAction();
    if (!creators) return;
  
    // Normalize to array
    const creatorArray = Array.isArray(creators) ? creators : [creators];
    
    const subscription = this.actions$.pipe(
      ofType(...creatorArray), // ofType accepts multiple action creators
      tap(() => {
        this.submitting.set(false);
      })
    ).subscribe();
  
    onCleanup(() => subscription.unsubscribe());
  });

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

  ngOnDestroy(): void {
    this.fillFormEffect.destroy();
    this.loadErrorEffect.destroy();
  }

  handleSubmit(): void {
    if (this.submitting()) return;
    this.submitting.set(true);
    const formData = this.form.value as TaxGroupCU;
    if (this.mode() === 'create') {
      const {name, rate, description, groups} = formData;
      const newTaxGroup = {
        name,
        rate: Number(rate),
        ...(description && { description }),
        groups: groups ? groups.map(group => ({
          mode: group.mode,
          taxids: group.taxids
        })) : []
      };
      this.store.dispatch(taxGroupActions.createTaxGroup({ taxGroup: newTaxGroup }));
    } else if (this.mode() === 'edit' && this.taxGroupId()) {
      this.store.dispatch(taxGroupActions.updateTaxGroup({ 
        id: this.taxGroupId()!, 
        taxGroup: formData 
      }));
    }
  }

  // getters in your component.ts
get groups(): FormArray<GroupForm> {
  return this.form.get('groups') as FormArray<GroupForm>;
}

taxidsAt(i: number): FormArray<FormControl<string>> {
  return this.groups.at(i).get('taxids') as FormArray<FormControl<string>>;
}

taxesAt(i: number): FormArray<FormControl<Tax>> {
  return this.groups.at(i).get('taxes') as FormArray<FormControl<Tax>>;
}

  addGroup(): void {
    const groups = this.form.get('groups') as FormArray
    groups.push(this.fb.group({
      mode: new FormControl<string>(''),
      taxids: this.fb.array<FormControl<string>>([]),
      taxes: this.fb.array<FormControl<Tax>>([])
    }));
  }
  
  removeGroup(index: number): void {
    const groups = this.form.get('groups') as FormArray
    groups.removeAt(index);
  }
  
  addTaxId(index: number): void {
    
  }

  removeTaxId(index: number, taxIdIndex: number): void {
  }
  
  onTaxSearch(value: string) {
    this.store.dispatch(taxActions.loadTaxes({ query: { search: { query: value, fields: ['name', 'description'] } } }));
  }

  onTaxSelected(tax: Tax, index: number) {
    this.form.patchValue({ tax:  null});
    this.taxesAt(index).push(new FormControl<Tax>(tax) as FormControl<Tax>);
  }

  findTaxDisplayValue(tax: Tax) {
    return tax.name;
  }

  findTaxInputDisplayValue(tax: Tax) {
    return '';
  }
}
