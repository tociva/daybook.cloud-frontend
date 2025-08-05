export type FormFieldType = 'text' | 'email' | 'select' | 'textarea' | 'date' | 'number' | 'checkbox';

export interface FormField<T = unknown> {
  key: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  options?: { label: string; value: string }[];
  group?: string;
  errors?: string[];
  validators?: (value: any, formData?: T) => string[];
}
