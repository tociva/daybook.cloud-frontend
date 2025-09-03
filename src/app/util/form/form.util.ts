import { FormField } from '../types/form-field.model';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

export class FormUtil {

  private static createNestedGroup(obj: any, fb: FormBuilder): FormGroup {
    const group: Record<string, any> = {};

    for (const key of Object.keys(obj)) {
      const value = obj[key];
      if (value instanceof FormControl) {
        group[key] = value;
      } else {
        group[key] = this.createNestedGroup(value, fb);
      }
    }

    return fb.group(group);
  }

  public static buildForm(fields: FormField[], fb: FormBuilder): FormGroup {
    const root: any = {};

    for (const field of fields) {
      const segments = field.key.split('.');
      const controlName = segments.pop()!;
      let current = root;

      for (const segment of segments) {
        current[segment] ??= {};
        current = current[segment];
      }

      current[controlName] = field.required
        ? fb.control(field.value ?? null, Validators.required)
        : fb.control(field.value ?? null);
    }

    return this.createNestedGroup(root, fb);
  }


  public static setByPath(form: FormGroup, path: string, value: any, opts = { emitEvent: true }) {
    const ctrl = form.get(path);
    if (!ctrl) {
      return;
    }
    ctrl.setValue(value, opts);
    // optionally:
    ctrl.markAsDirty();
    ctrl.updateValueAndValidity({ emitEvent: false });
  }
}
