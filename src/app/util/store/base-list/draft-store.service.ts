import { Injectable, signal, computed, Signal /*, isDevMode*/ } from '@angular/core';

type DraftMap = Record<string, unknown>;

function cloneDeep<T>(v: T): T {
  if (v == null) return v;
  try {
    // modern browsers + Node 18+ (SSR) support this
    return structuredClone(v);
  } catch {
    // safe fallback for very old runtimes
    return JSON.parse(JSON.stringify(v));
  }
}

@Injectable({ providedIn: 'root' })
export class DraftStore {
  private readonly _drafts = signal<DraftMap>({});
  private readonly _oneTimeDrafts = signal<DraftMap>({});

  select<T>(key: string): Signal<T | null> {
    return computed(() => (this._drafts()[key] as T | undefined) ?? null);
  }

  set<T>(key: string, draft: T | null | undefined): void {
    if (draft == null) {
      // treat null/undefined as "clear" to avoid storing null sentinels
      this.clear(key);
      return;
    }
    const safe = cloneDeep(draft);
    // if (isDevMode()) deepFreeze(safe);
    this._drafts.update(d => ({ ...d, [key]: safe }));
  }

  patch<T extends object>(key: string, partial: Partial<T>): void {
    const current = (this._drafts()[key] as T) ?? ({} as T);
    const merged = { ...current, ...partial } as T;
    this.set<T>(key, merged); // single deep clone inside set
  }

  clear(key: string): void {
    const { [key]: _, ...rest } = this._drafts();
    this._drafts.set(rest);
  }

  clearAll(): void {
    this._drafts.set({});
  }

  setOneTimeDraft<T>(key: string, value: T): void {
    const safe = cloneDeep(value);
    this._oneTimeDrafts.update(d => ({ ...d, [key]: safe }));
  }

  consumeOneTimeDraft<T, V>(key: string): V | null {
    let result: T | null = null;
    this._oneTimeDrafts.update(d => {
      const v = (d[key] as T | undefined) ?? null;
      result = v;
      if (v === null) return d;
      const { [key]: _, ...rest } = d;
      return rest;
    });
    return result;
  }

  peekOneTimeDraft<T>(key: string): T | null {
    const v = (this._oneTimeDrafts()[key] as T | undefined) ?? null;
    return v == null ? null : cloneDeep(v);
  }

  clearAllOneTimeDrafts(): void {
    this._oneTimeDrafts.set({});
  }
}
