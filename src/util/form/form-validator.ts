import { FormField } from '../types/form-field.model';

export class FormValidator {
  static validate<T = any>(data: T, fields: FormField<T>[]): FormField<T>[] {
    return fields.map(field => {
      const value = this.getValueByPath(data, field.key);

      const errors: string[] = field.validators?.(value, data) ?? [];

      return {
        ...field,
        errors,
      };
    });
  }

  private static getValueByPath(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }
}
