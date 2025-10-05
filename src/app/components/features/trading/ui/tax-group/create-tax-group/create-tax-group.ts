import { NgClass } from '@angular/common';
import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { tap } from 'rxjs';
import { buildFormKey } from '../../../../../../util/common.util';
import { WithFormDraftBinding } from '../../../../../../util/form/with-form-draft-binding';
import { TaxGroupJSON } from '../../../../../../util/types/tax-group.type';
import { AutoComplete } from '../../../../../shared/auto-complete/auto-complete';
import { CancelButton } from '../../../../../shared/cancel-button/cancel-button';
import { InputWithSuggestion } from '../../../../../shared/input-with-suggestion/input-with-suggestion';
import { ItemNotFound } from '../../../../../shared/item-not-found/item-not-found';
import { SkeltonLoader } from '../../../../../shared/skelton-loader/skelton-loader';
import { taxActions, TaxStore } from '../../../store/tax';
import { taxGroupActions, TaxGroupModeStore, TaxGroupStore } from '../../../store/tax-group';
import { TaxGroupCU } from '../../../store/tax-group/tax-group.model';
import { Tax } from '../../../store/tax/tax.model';

interface TaxGroupForm {
  name: string;
  rate: number;
  description?: string;
  groups: Array<{
    mode: string;
    taxes: Tax[];
  }>;
}

type GroupForm = FormGroup<{
  mode: FormControl<string>;
  taxes: FormArray<FormControl<Tax>>;
  tax: FormControl<Tax>;
}>;
@Component({
  selector: 'app-create-tax-group',
  imports: [SkeltonLoader, ItemNotFound, NgClass, ReactiveFormsModule, AutoComplete, CancelButton, NgIcon, InputWithSuggestion],
  templateUrl: './create-tax-group.html',
  styleUrl: './create-tax-group.css'
})
export class CreateTaxGroup extends WithFormDraftBinding implements OnInit {

  public static readonly ONE_TIME_DRAFT_KEY = 'ONE_TIME_DRAFT_KEY_TAX_GROUP'

  private readonly fb = inject(FormBuilder)
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  readonly taxGroupStore = inject(TaxGroupStore);
  readonly taxGroupModeStore = inject(TaxGroupModeStore);
  readonly taxStore = inject(TaxStore);
  readonly selectedTaxGroup = this.taxGroupStore.selectedItem;
  readonly actions$ = inject(Actions);
  protected loading = 0;
  protected readonly mode = signal<'create' | 'edit'>('create');
  private taxGroupId = signal<string | null>(null);
  private router = inject(Router);
  readonly formKey = computed(() => buildFormKey('tax-group', this.mode(), this.taxGroupId()));
  readonly submitting = signal(false);


  taxes = this.taxStore.items;
  filteredTaxes = signal<Tax[]>([]);
  modes = this.taxGroupModeStore.items;
  filteredModes = signal<string[]>([]);
  readonly form: FormGroup;

  private buildGroupRow(group: TaxGroupJSON): GroupForm {
    const taxes = this.taxes();
    const groupTaxes = taxes.filter(t => group.taxids.includes(t.id ?? ''));
  
    return this.fb.group({
      mode: this.fb.control(group.mode ?? 'include', { nonNullable: true }),
      taxes: this.fb.array(groupTaxes.map(t => this.fb.control<Tax>(t, { nonNullable: true }))),
      tax: this.fb.control<Tax | null>(null),
    }) as GroupForm;
  }

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

  private loadTaxGroupById = () => {
    const lastSegment = this.route.snapshot.url[this.route.snapshot.url.length - 1]?.path;
    const id = this.route.snapshot.paramMap.get('id');
    
    if (lastSegment === 'create') {
      this.mode.set('create');
    } else if (lastSegment === 'edit' && id) {
      this.mode.set('edit');
      this.taxGroupId.set(id);
      this.loading++;
      this.store.dispatch(taxGroupActions.loadTaxGroupById({ id }));
    } else if (lastSegment === 'view' && id) {
      this.mode.set('edit');
      this.taxGroupId.set(id);
      this.loading++;
      this.store.dispatch(taxGroupActions.loadTaxGroupById({ id }));
    }
  }

  private fillFormEffect = effect(() => {
    const taxGroup = this.selectedTaxGroup();
    if (!taxGroup) return;
    this.form.patchValue({
      name: taxGroup.name ?? null,
      rate: taxGroup.rate ?? null,
      description: taxGroup.description ?? null,
    });
  
    const rows = taxGroup.groups.map(g => this.buildGroupRow(g));
    const groupsFA = this.fb.array<GroupForm>(rows);
  
    this.form.setControl('groups', groupsFA);
    this.loading--;
  });

  private loadErrorEffect = effect(() => {
    const error = this.taxGroupStore.error();
    if (error && this.mode() === 'edit') {
      this.loading--;
    }
  });

  private goBack = () => {
    const burl = this.route.snapshot.queryParamMap.get('burl') ?? '/app/trading/tax-group';
    this.router.navigateByUrl(burl);
  }

  readonly saveSuccessEffect = effect((onCleanup) => {
    const subscription = this.actions$.pipe(
      ofType(taxGroupActions.createTaxGroupSuccess),
      tap(() => {
        this.goBack();
      })
    ).subscribe();

    onCleanup(() => subscription.unsubscribe());
  });

  readonly failureActionEffect = effect((onCleanup) => {
    const subscription = this.actions$.pipe(
      ofType(taxGroupActions.createTaxGroupFailure),
      tap(() => {
        this.submitting.set(false);
        this.taxGroupStore.setError(null);
      })
    ).subscribe();
  
    onCleanup(() => subscription.unsubscribe());
  });

  readonly updateSuccessEffect = effect((onCleanup) => {
    const subscription = this.actions$.pipe(
      ofType(taxGroupActions.updateTaxGroupSuccess),
      tap(() => {
        this.submitting.set(false);
        this.goBack();
      })
    ).subscribe();

    onCleanup(() => subscription.unsubscribe());
  });

  readonly updateFailureEffect = effect((onCleanup) => {
    const subscription = this.actions$.pipe(
      ofType(taxGroupActions.updateTaxGroupFailure),
      tap(() => {
        this.taxGroupStore.setError(null);
        this.submitting.set(false);
      })
    ).subscribe();

    onCleanup(() => subscription.unsubscribe());
  });

  readonly loadTaxesSuccessEffect = effect((onCleanup) => {
    const subscription = this.actions$.pipe(
      ofType(taxActions.loadTaxesSuccess),
      tap(() => {
        this.loading--;
      })
    ).subscribe();

    onCleanup(() => subscription.unsubscribe());
  });

  readonly loadTaxesFailureEffect = effect((onCleanup) => {
    const subscription = this.actions$.pipe(
      ofType(taxActions.loadTaxesFailure),
      tap(() => {
        this.loading--;
      })
    ).subscribe();

    onCleanup(() => subscription.unsubscribe());
  });

  readonly loadTaxGroupModesSuccessEffect = effect((onCleanup) => {
    const subscription = this.actions$.pipe(
      ofType(taxGroupActions.loadTaxGroupModesSuccess),
      tap(() => {
        this.loading--;
      })
    ).subscribe();

    onCleanup(() => subscription.unsubscribe());
  });
  readonly loadTaxGroupModesFailureEffect = effect((onCleanup) => {
    const subscription = this.actions$.pipe(
      ofType(taxGroupActions.loadTaxGroupModesFailure),
      tap(() => {
        this.loading--;
      })
    ).subscribe();

    onCleanup(() => subscription.unsubscribe());
  });

  ngOnInit(): void {
    // Load taxes for the tax group selector
    this.loading++;
    this.store.dispatch(taxActions.loadTaxes({}));
    // Load tax group modes for the tax group selector
    this.loading++;
    this.store.dispatch(taxGroupActions.loadTaxGroupModes({}));
    this.loadTaxGroupById();

  }

  ngOnDestroy(): void {
    this.fillFormEffect.destroy();
    this.loadErrorEffect.destroy();
  }

  handleSubmit(): void {
    if (this.submitting()) return;
    this.submitting.set(true);
    const formData = this.form.value as TaxGroupForm;
    const {name, rate, description, groups} = formData;
    const nGroups = groups.map(group => ({
      mode: group.mode,
      taxids: group.taxes.map(tax => tax.id ?? '')
    }));
    console.log(nGroups);
    const newTaxGroup: TaxGroupCU = {
      name,
      rate: Number(rate),
      ...(description && { description }),
      groups: nGroups
    };
    if (this.mode() === 'create') {
      this.store.dispatch(taxGroupActions.createTaxGroup({ taxGroup: newTaxGroup }));
    } else if (this.mode() === 'edit' && this.taxGroupId()) {
      this.store.dispatch(taxGroupActions.updateTaxGroup({ 
        id: this.taxGroupId()!, 
        taxGroup: newTaxGroup
      }));
    }
  }

  // getters in your component.ts
get groups(): FormArray<GroupForm> {
  return this.form.get('groups') as FormArray<GroupForm>;
}

taxesAt(i: number): FormArray<FormControl<Tax>> {
  return this.groups.at(i).get('taxes') as FormArray<FormControl<Tax>>;
}

  addGroup(): void {
    const groups = this.form.get('groups') as FormArray
    groups.push(this.fb.group({
      mode: new FormControl<string>(''),
      taxes: this.fb.array<FormControl<Tax>>([]),
      tax: new FormControl<Tax | null>(null)
    }));
  }
  
  removeGroup(index: number): void {
    const groups = this.form.get('groups') as FormArray
    groups.removeAt(index);
  }
  
  addTaxId(index: number): void {
    
  }
  removeTax(groupIndex: number, taxIndex: number) {
    this.taxesAt(groupIndex).removeAt(taxIndex);
  }
  
  onTaxSearch(value: string) {
    const filteredTaxes = this.taxes().filter(tax => tax.name?.toLowerCase().includes(value.toLowerCase()));
    this.filteredTaxes.set(filteredTaxes);
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
  onModeSearch(value: string) {
    const filteredModes = this.modes().filter(mode => mode.toLowerCase().includes(value.toLowerCase()));
    this.filteredModes.set(filteredModes);
  }
  onModeSelected(mode: string, index: number) {
  }
}
