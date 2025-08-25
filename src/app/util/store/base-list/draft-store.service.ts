import { Injectable, signal, computed, Signal } from '@angular/core';

type DraftMap = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class DraftStore {
  private readonly _drafts = signal<DraftMap>({});

  select<T>(key: string): Signal<T | null> {
    return computed(() => (this._drafts()[key] as T) ?? null);
  }

  set<T>(key: string, draft: T): void {
    const value = draft == null ? null : JSON.parse(JSON.stringify(draft));
    this._drafts.update(d => ({ ...d, [key]: value }));
  }

  patch<T extends object>(key: string, partial: Partial<T>): void {
    const current = (this._drafts()[key] as T) ?? ({} as T);
    this.set<T>(key, { ...current, ...partial } as T);
  }

  clear(key: string): void {
    const { [key]: _, ...rest } = this._drafts();
    this._drafts.set(rest);
  }

  clearAll(): void {
    this._drafts.set({});
  }
}
