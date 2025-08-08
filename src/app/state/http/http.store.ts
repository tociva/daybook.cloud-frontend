import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { HttpState } from './http.state';

const initialState: HttpState = {
  loading: {},
  errors: {}
};

export const HttpStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    startLoading: (requestId: string) => {
      patchState(store, (state) => ({
        loading: { ...state.loading, [requestId]: true }
      }));
    },
    
    stopLoading: (requestId: string) => {
      patchState(store, (state) => {
        const newLoading = { ...state.loading };
        delete newLoading[requestId];
        return { loading: newLoading };
      });
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
    getError: (requestId: string) => store.errors()[requestId]
  }))
);