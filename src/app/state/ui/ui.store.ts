import { Injectable, computed, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/**
 * Tracks global loading state using a set of unique tokens.
 * Each API call gets a unique token; the loader stays active until all tokens are cleared.
 */
@Injectable({ providedIn: 'root' })
export class UiStore {
  private readonly _loadingTokens = signal<Set<string>>(new Set());

  /** Whether any loading token is active (used by global spinner) */
  readonly isLoading = computed(() => this._loadingTokens().size > 0);

  /** Add a loading token to indicate start of an async operation */
  startLoading(token: string): void {
    const current = new Set(this._loadingTokens());
    current.add(token);
    this._loadingTokens.set(current);
  }

  /** Remove a loading token to indicate completion of an async operation */
  stopLoading(token: string): void {
    const current = new Set(this._loadingTokens());
    current.delete(token);
    this._loadingTokens.set(current);
  }

  /**
   * Wraps an observable to automatically start/stop loading token
   */
  track<T>(actionName: string, observable: Observable<T>): Observable<T> {
    const token = `${actionName}-${Date.now()}-${Math.random()}`;
    this.startLoading(token);
    return observable.pipe(
      finalize(() => this.stopLoading(token))
    );
  }
}
