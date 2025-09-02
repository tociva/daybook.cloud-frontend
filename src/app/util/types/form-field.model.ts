import { Signal } from "@angular/core";

export type FormFieldType = 'text' | 'email' | 'select' | 'textarea' | 'date' | 'number' | 'checkbox' | 'auto-complete' | 'month-date' | 'fiscal-daterange';

export interface FormField<T = unknown> {
  value?: T | null;
  key: string;
  label: string;
  placeholder?: string;
  type: FormFieldType;
  required?: boolean;
  readonly?: boolean;
  options?: { label: string; value: string }[];
  group?: string;
  errors?: string[];
  validators?: (value: unknown, formData?: T) => string[];
  autoComplete?: {
    items: Signal<T[]>;
    optionDisplayValue: (item: any) => string;
    inputDisplayValue: (item: any) => string;
    trackBy: (item: any) => string;
    onSearch: (value: string) => void;
    onOptionSelected?: (item: any) => void;
  };
}
