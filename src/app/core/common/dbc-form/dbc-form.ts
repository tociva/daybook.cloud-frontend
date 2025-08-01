import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Signal,
  signal
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule
} from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Observable } from 'rxjs';

// --- Model ---
export interface FieldConfig {
  name: string;
  type: 'text' | 'number' | 'checkbox' | 'autocomplete';
  label?: string;
  defaultValue?: any;
  options?: string[]; // for static
  asyncOptions$?: Observable<string[]>; // for async
  filterFn?: (term: string, options: string[]) => string[];
}

// --- Component ---
@Component({
  selector: 'app-dbc-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatAutocompleteModule
  ],
  templateUrl: './dbc-form.html',
  styleUrl: './dbc-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DbcForm implements AfterViewInit {
  private fb = inject(FormBuilder);

  fieldConfigs = signal<FieldConfig[]>([]);
  form = signal<FormGroup>(this.fb.group({}));

  filteredOptions: Record<string, Signal<string[]>> = {};

  setFields(fields: FieldConfig[], initialValues: Record<string, any> = {}) {
    this.fieldConfigs.set(fields);

    const group: Record<string, FormControl> = {};
    const filters: Record<string, Signal<string[]>> = {};

    for (const field of fields) {
      const control = new FormControl(initialValues[field.name] ?? field.defaultValue ?? '');

      // Autocomplete setup
      if (field.type === 'autocomplete') {
        const optionsSignal = field.asyncOptions$
          ? toSignal(field.asyncOptions$)
          : signal(field.options ?? []);

        filters[field.name] = computed(() => {
          const term = control.value ?? '';
          const allOptions = optionsSignal() ?? [];
          return field.filterFn
            ? field.filterFn(term, allOptions)
            : allOptions.filter(opt => opt.toLowerCase().includes(term.toLowerCase()));
        });
      }

      group[field.name] = control;
    }

    this.form.set(this.fb.group(group));
    this.filteredOptions = filters;
  }

  patchValue(value: Record<string, any>) {
    this.form().patchValue(value);
  }

  get value(): Record<string, any> {
    return this.form().value;
  }

  ngAfterViewInit(): void {
    // Optional: auto-focus or other setup
  }

  trackByFn = (_: number, field: FieldConfig) => field.name;
}
