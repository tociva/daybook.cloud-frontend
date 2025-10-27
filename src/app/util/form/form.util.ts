import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormField } from '../types/form-field.model';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { distinctUntilChanged, map, startWith } from 'rxjs';
import { DestroyRef, effect, inject, signal, WritableSignal } from '@angular/core';

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

  /**
   * Bi-directionally bind a FormControl to a WritableSignal<T>.
   * - Reads initial value from the control (or fallback).
   * - Updates the signal when the control changes.
   * - Pushes signal updates back to the control without causing feedback loops.
   */
  public static controlWritableSignal<T>(
    fg: FormGroup,
    name: string,
    fallback: T,
    opts?: { equal?: (a: T, b: T) => boolean; coerceBoolean?: boolean }
  ): WritableSignal<T> {
    const destroyRef = inject(DestroyRef);
    const c = fg.get(name) as FormControl<T> | null;

    // start value
    const start = (c?.value ?? fallback) as T;

    // writable signal
    const s = signal<T>(start, { equal: opts?.equal });

    // --- Control -> Signal
    c?.valueChanges.pipe(
      startWith(start),
      map((v) => {
        if (opts?.coerceBoolean ?? typeof fallback === 'boolean') {
          return (Boolean(v) as unknown) as T;
        }
        return (v ?? fallback) as T;
      }),
      distinctUntilChanged(opts?.equal),
      takeUntilDestroyed(destroyRef),
    ).subscribe((v) => {
      // write to signal
      s.set(v);
    });

    // --- Signal -> Control
    effect(() => {
      if (!c) return;
      const next = s();

      // avoid churn
      const isSame = opts?.equal ? opts.equal(next, c.value as T) : Object.is(next, c.value);
      if (!isSame) {
        // do not emit, otherwise we'd loop back into valueChanges
        c.setValue(next, { emitEvent: false });
      }
    });

    return s;
  }
}
