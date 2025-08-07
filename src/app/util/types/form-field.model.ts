import { Signal } from "@angular/core";

export type FormFieldType = 'text' | 'email' | 'select' | 'textarea' | 'date' | 'number' | 'checkbox' | 'auto-complete';

export interface FormField<T = unknown> {
  value?: T | null;
  key: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  options?: { label: string; value: string }[];
  group?: string;
  errors?: string[];
  validators?: (value: unknown, formData?: T) => string[];
  autoComplete?: {
    items: Signal<T[]>;
    displayValue: (item: any) => string;
    trackBy: (item: any) => string;
    onSearch: (value: string) => void;
    onSelect?: (item: any) => void;
  };
}
