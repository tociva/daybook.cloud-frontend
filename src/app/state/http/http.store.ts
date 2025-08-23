import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { HttpState } from './http.state';
import { Observable, EMPTY, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

const initialState: HttpState = {
  loading: {},
  errors: {}
};

/** Private, in-memory ref-counts so booleans in state stay concurrency-safe */
const refCounts = new Map<string, number>();

function inc(requestId: string): number {
  const n = (refCounts.get(requestId) ?? 0) + 1;
  refCounts.set(requestId, n);
  return n;
}

function dec(requestId: string): number {
  const cur = refCounts.get(requestId) ?? 0;
  const n = Math.max(0, cur - 1);
  if (n === 0) refCounts.delete(requestId);
  else refCounts.set(requestId, n);
  return n;
}

/** Treat Firefox NS_BINDING_ABORTED / fetch AbortError / XHR abort (status 0 + ProgressEvent 'abort') as benign */
function isAbortLike(err: unknown): boolean {
  // fetch-style AbortController
  if (err && typeof err === 'object' && (err as any).name === 'AbortError') return true;
  if (err instanceof DOMException && err.name === 'AbortError') return true;

  // Firefox NS_BINDING_ABORTED - check error message
  if (err && typeof err === 'object') {
    const message = (err as any).message || '';
    if (typeof message === 'string' && message.includes('NS_BINDING_ABORTED')) return true;
  }

  // Angular HttpClient (XHR)
  if (err instanceof HttpErrorResponse) {
    const pe = err.error as ProgressEvent | undefined;
    
    // Explicit abort event
    if (pe?.type === 'abort') return true;
    
    // Firefox NS_BINDING_ABORTED often comes as HttpErrorResponse
    if (err.message && err.message.includes('NS_BINDING_ABORTED')) return true;
    
    // Status 0 with error/abort-like events (more permissive for cancellations)
    if (err.status === 0) {
      // Check for abort-like conditions
      if (pe?.type === 'error' || pe?.type === 'abort' || pe?.type === '') {
        // Additional checks to distinguish from real network errors
        // If the error message suggests cancellation, treat as abort
        if (err.message.includes('abort') || 
            err.message.includes('cancel') || 
            err.message.includes('NS_BINDING_ABORTED') ||
            err.statusText === '' || 
            err.statusText === 'Unknown Error') {
          return true;
        }
      }
    }
  }

  // Check for other common cancellation indicators
  if (err && typeof err === 'object') {
    const errObj = err as any;
    // Some libraries use these properties for cancellations
    if (errObj.cancelled === true || errObj.canceled === true) return true;
    if (errObj.code === 'ABORT' || errObj.code === 'CANCELLED') return true;
  }

  return false;
}

export const HttpStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    /** Concurrency-safe: flips boolean true only on the first concurrent caller */
    startLoading: (requestId: string) => {
      const became = inc(requestId);
      if (became === 1) {
        patchState(store, (state) => ({
          loading: { ...state.loading, [requestId]: true }
        }));
      }
    },

    /** Concurrency-safe: clears boolean only when the last concurrent caller completes */
    stopLoading: (requestId: string) => {
      const remaining = dec(requestId);
      if (remaining === 0) {
        patchState(store, (state) => {
          const newLoading = { ...state.loading };
          delete newLoading[requestId];
          return { loading: newLoading };
        });
      }
    },

    setError: (requestId: string, error: any) => {
      patchState(store, (state) => ({
        errors: { ...state.errors, [requestId]: error }
      }));
    },

    clearError: (requestId: string) => {
      patchState(store, (state) => {
        const newErrors = { ...state.errors };
        delete newErrors[requestId];
        return { errors: newErrors };
      });
    },

    isLoading: (requestId: string) => store.loading()[requestId] || false,
    getError: (requestId: string) => store.errors()[requestId],

    /**
     * Wrap any observable:
     * - start/stop loading (concurrency-safe)
     * - clear/set error
     * - ignore abort-like errors (NS_BINDING_ABORTED, AbortError, XHR abort)
     */
    track<T>(requestId: string, observable: Observable<T>): Observable<T> {
      // begin
      (this as any).startLoading(requestId);
      (this as any).clearError(requestId);

      return observable.pipe(
        catchError((err) => {
          if (isAbortLike(err)) {
            // Swallow cancelation: no error UI, but still finalize() will stop loader
            return EMPTY;
          }
          (this as any).setError(requestId, err);
          return throwError(() => err);
        }),
        finalize(() => (this as any).stopLoading(requestId))
      );
    },
  }))
);