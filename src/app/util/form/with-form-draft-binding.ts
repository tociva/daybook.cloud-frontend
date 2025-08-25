import { Signal, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { DraftStore } from '../store/base-list/draft-store.service';

export type BindFormDraftOptions<T> = {
  selected?: Signal<T | null>;
  persistIf?: (form: FormGroup, v: T | undefined) => boolean;
  normalizePersist?: (v: T) => T;
  preferDraftOverSelected?: boolean;
  preHydrate?: (ctx: { value: T; draftStore: DraftStore; form: FormGroup }) => T;
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
      persistIf,
      normalizePersist,
      preferDraftOverSelected = true,
      preHydrate,
    } = opts;

    const valueSig = toSignal<T | undefined>(
      form.valueChanges.pipe(debounceTime(500)),
      { initialValue: undefined }
    );

    effect(() => {
      const key = formKey();
      const draft = this.draftStore.select<T>(key)();
      const sel = selected?.() ?? null;
      let source = preferDraftOverSelected ? (draft ?? sel) : (sel ?? draft);
      if (!source) return;
      if (preHydrate) {
        source = preHydrate({ value: source as T, draftStore: this.draftStore, form });
      }
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
