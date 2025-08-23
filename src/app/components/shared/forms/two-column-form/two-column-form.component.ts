import { NgClass } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  Signal,
  untracked
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Actions, ofType } from '@ngrx/effects';
import { ActionCreator } from '@ngrx/store';
import { map, tap } from 'rxjs/operators';
import { FormField } from '../../../../util/types/form-field.model';
import { AutoComplete } from '../../auto-complete/auto-complete';
import { CancelButton } from '../../cancel-button/cancel-button';
import { MonthDatePicker } from '../../month-date-picker/month-date-picker';

@Component({
  selector: 'app-two-column-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass, AutoComplete, CancelButton, MonthDatePicker],
  templateUrl: './two-column-form.component.html',
  styleUrl: './two-column-form.component.css'
})
export class TwoColumnFormComponent<T> {

  private actions$ = inject(Actions);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private backUrl = toSignal(
    this.route.queryParams.pipe(
      map(params => params['burl'] ?? null)
    ),
    { initialValue: null }
  );
  readonly form = model<FormGroup>(new FormGroup({}));
  readonly fields = model<FormField[]>([]);
  readonly title = input<string>('');

  readonly formSubmit = output<T>();
  readonly submitting = signal(false);
  readonly successAction = input<ActionCreator[] | ActionCreator | null>(null);

  readonly groupedFields: Signal<Record<string, FormField[]>> = computed(() => {
    const fieldList = this.fields();
    const grouped: Record<string, FormField[]> = {};

    for (const field of fieldList) {
      const group = field.group ?? 'Default';
      grouped[group] ??= [];
      grouped[group].push(field);
    }
    return grouped;
  });

  protected readonly groupKeys = computed(() => Object.keys(this.groupedFields()));

  // EFFECT 1: stable listener for success action(s)
  private readonly successActionEffect = effect((onCleanup) => {
    const creators = this.successAction();
    if (!creators) return;
  
    // Normalize to array
    const creatorArray = Array.isArray(creators) ? creators : [creators];
    
    const subscription = this.actions$.pipe(
      ofType(...creatorArray), // ofType accepts multiple action creators
      tap(() => {
        const url = untracked(() => this.backUrl());
        this.submitting.set(false);
        this.router.navigate([url ?? '/']);
      })
    ).subscribe();
  
    onCleanup(() => subscription.unsubscribe());
  });

  // EFFECT 2: react to UI signals (no stream returned)
  private readonly uiEffect = effect(() => {
    // track these freely; this effect doesn't manage subscriptions
    const _ = this.form?.();
    const __ = this.fields?.();
    const ___ = this.title?.();

    // any UI-only side effects here (avoid calling actions$ here)
    // e.g., reset a local flag when form/fields/title change:
    // this.someUiFlag.set(false);
  });

  // EFFECT 3: if fields carry validation errors, stop submitting spinner
  private readonly validationErrorsEffect = effect(() => {
    const fields = this.fields(); // reacts when parent sets validatedFields
    const hasErrors = fields?.some(f => (f.errors?.length ?? 0) > 0);
    if (hasErrors) {
      this.submitting.set(false);
    }
  });


  onDestroy() {
    this.successActionEffect.destroy();
    this.uiEffect.destroy();
    this.validationErrorsEffect.destroy();
  }

  getControl<K extends string>(key: K): FormControl<unknown> {
    const control = this.form().get(key);
    if (!control || !(control instanceof FormControl)) {
      throw new Error(`Form control not found or not a FormControl: ${key}`);
    }
    return control as FormControl<unknown>;
  }

  onSubmit(): void {
    if (this.submitting()) return;
    this.submitting.set(true);
    const clearedFields = this.fields().map(field => ({
      ...field,
      errors: [],
    }));
    
    this.fields.set(clearedFields);
    const formValue = this.form().value;
    this.formSubmit.emit(formValue as T);
  }

}
