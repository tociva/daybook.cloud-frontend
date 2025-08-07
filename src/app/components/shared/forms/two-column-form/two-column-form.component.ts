import { NgClass } from '@angular/common';
import {
  Component,
  computed,
  model,
  output,
  Signal
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule
} from '@angular/forms';
import { FormField } from '../../../../util/types/form-field.model';
import { AutoComplete } from '../../auto-complete/auto-complete';
import { CancelButton } from '../../cancel-button/cancel-button';

@Component({
  selector: 'app-two-column-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass, AutoComplete, CancelButton],
  templateUrl: './two-column-form.component.html',
  styleUrl: './two-column-form.component.css'
})
export class TwoColumnFormComponent<T> {

  readonly model = model<{
    form: FormGroup;
    fields: FormField[];
    title: string;
  }>({
    form: new FormGroup({}),
    fields: [],
    title: '',
  });

  readonly formSubmit = output<T>();

  readonly groupedFields: Signal<Record<string, FormField[]>> = computed(() => {
    const fields = this.model().fields;
    const grouped: Record<string, FormField[]> = {};

    for (const field of fields) {
      const group = field.group ?? 'Default';
      grouped[group] ??= [];
      grouped[group].push(field);
    }
    return grouped;
  });

  protected readonly groupKeys = computed(() => Object.keys(this.groupedFields()));

  getControl<K extends string>(key: K): FormControl<unknown> {
    const control = this.model().form.get(key);
    if (!control || !(control instanceof FormControl)) {
      throw new Error(`Form control not found or not a FormControl: ${key}`);
    }
    return control as FormControl<unknown>; // fallback default
  }

  onSubmit(): void {
    const fields = this.model().fields.map(field => ({
      ...field,
      errors: [],
    }));
    
    this.model.update((prev) => ({
      ...prev,
      fields,
    }));
  
    this.formSubmit.emit(this.model().form.value as T);
  }
  handleAutoCompleteSelect(field: FormField, value: any): void {
    field.autoComplete?.onSelect?.(value);
    this.getControl(field.key).setValue(value);
    this.getControl(field.key).setValue(value, { emitEvent: true });
    this.getControl(field.key).markAsDirty();
    this.getControl(field.key).markAsTouched();
  }

  onCancel(): void {
  }
  
}
