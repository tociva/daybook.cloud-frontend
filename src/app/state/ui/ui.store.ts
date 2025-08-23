// ui.store.ts (optional simplified spinner)
import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpStore } from '../http/http.store'; // adjust path

@Injectable({ providedIn: 'root' })
export class UiStore {
  // keep any other UI signals you already have...
  private readonly http = inject(HttpStore);

  // Global spinner derived from HttpStore
  readonly isLoading = computed(() => {
    const map = this.http.loading(); // Record<string, boolean>
    for (const k in map) if (map[k]) return true;
    return false;
  });

  // If you still want ad-hoc/manual spinners elsewhere, you can keep token-based API:
  private readonly _manual = signal(0);
  startManual() { this._manual.set(this._manual() + 1); }
  stopManual() { this._manual.set(Math.max(0, this._manual() - 1)); }

  // Combined flag (HTTP or manual)
  readonly isAnyLoading = computed(() => this.isLoading() || this._manual() > 0);
}
