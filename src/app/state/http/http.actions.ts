import { createActionGroup, props } from '@ngrx/store';
import { HttpRequestConfig, HttpRequestMetadata } from './http.model';
import { DbcError } from '../../util/types/dbc-error.type';

export const httpActions = createActionGroup({
  source: 'Http',
  events: {
    // Generic HTTP request action - use unknown instead of any
    executeRequest: props<{ 
      config: HttpRequestConfig; 
      metadata: HttpRequestMetadata<unknown>;
    }>(),
    
    // Generic success/failure actions - use unknown for better type safety
    requestSuccess: props<{ 
      requestId: string; 
      data: unknown; 
      metadata: HttpRequestMetadata<unknown>;
    }>(),
    
    requestFailure: props<{ 
      requestId: string; 
      error: DbcError; 
      metadata: HttpRequestMetadata<unknown>;
    }>(),
    
    // Loading management - these don't need generics
    startLoading: props<{ requestId: string }>(),
    stopLoading: props<{ requestId: string }>(),
    
    // Clear error for specific request
    clearError: props<{ requestId: string }>()
  }
});
