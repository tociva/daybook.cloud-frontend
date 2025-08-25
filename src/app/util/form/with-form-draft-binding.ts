import { Signal, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { DraftStore } from '../store/base-list/draft-store.service';

export type BindFormDraftOptions<T> = {
  selected?: Signal<T | null>;              // optional server/store entity
  debounceMs?: number;                      // default 500
  persistIf?: (form: FormGroup, v: T | undefined) => boolean; // default: form.dirty && v!==undefined
  normalizePersist?: (v: T) => T;           // strip view-only fields, etc.
  preferDraftOverSelected?: boolean;        // default true
};

export abstract class WithFormDraftBinding {
  protected readonly draftStore = inject(DraftStore);

  protected bindFormToDraft<T extends object>(
    form: FormGroup,
    formKey: Signal<string>,
    opts: BindFormDraftOptions<T> = {}
  ) {
    const {
      selected,
      debounceMs = 500,
      persistIf,
      normalizePersist,
      preferDraftOverSelected = true,
    } = opts;

    const valueSig = toSignal<T | undefined>(
      form.valueChanges.pipe(debounceTime(debounceMs)),
      { initialValue: undefined }
    );

    effect(() => {
      const key = formKey();
      const draft = this.draftStore.select<T>(key)();
      const sel = selected?.() ?? null;
      const source = preferDraftOverSelected ? (draft ?? sel) : (sel ?? draft);
      if (!source) return;
      form.patchValue(source as Partial<T>, { emitEvent: false });
      form.markAsPristine();
    });

    effect(() => {
      const key = formKey();
      const v = valueSig();
      const ok = persistIf ? persistIf(form, v) : (form.dirty && v !== undefined);
      if (!ok) return;
      this.draftStore.set<T>(key, normalizePersist ? normalizePersist(v as T) : (v as T));
    });

    return {
      valueSig,
      clear: () => this.draftStore.clear(formKey()),
    };
  }
}
