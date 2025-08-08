```javascript
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Action } from '@ngrx/store';
import { httpActions } from './http.actions';
import { HttpStore } from './http.store';
import { HttpRequestConfig, HttpRequestMetadata } from './http.model';

// Main function to execute HTTP requests in standalone components
export function executeHttpRequest<T>(options: {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  actionName: string;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  // New action-based options
  onSuccessAction?: (data: T) => Action;
  onErrorAction?: (error: any) => Action;
}): string {
  const store = inject(Store);
  const requestId = `${options.actionName}-${Date.now()}-${Math.random()}`;
  
  const config: HttpRequestConfig = {
    url: options.url,
    method: options.method,
    body: options.body,
    headers: options.headers,
    params: options.params
  };

  const metadata: HttpRequestMetadata = {
    requestId,
    actionName: options.actionName,
    successMessage: options.successMessage,
    errorMessage: options.errorMessage,
    onSuccess: options.onSuccess,
    onError: options.onError,
    onSuccessAction: options.onSuccessAction,
    onErrorAction: options.onErrorAction
  };

  store.dispatch(httpActions.executeRequest({ config, metadata }));
  return requestId;
}

// Convenience functions
export function httpGet<T>(
  url: string,
  options: {
    actionName: string;
    params?: Record<string, any>;
    headers?: Record<string, string>;
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: (data: T) => void;
    onError?: (error: any) => void;
    onSuccessAction?: (data: T) => Action;
    onErrorAction?: (error: any) => Action;
  }
): string {
  return executeHttpRequest({
    ...options,
    url,
    method: 'GET'
  });
}

export function httpPost<T>(
  url: string,
  body: any,
  options: {
    actionName: string;
    headers?: Record<string, string>;
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: (data: T) => void;
    onError?: (error: any) => void;
    onSuccessAction?: (data: T) => Action;
    onErrorAction?: (error: any) => Action;
  }
): string {
  return executeHttpRequest({
    ...options,
    url,
    method: 'POST',
    body
  });
}

export function httpPut<T>(
  url: string,
  body: any,
  options: {
    actionName: string;
    headers?: Record<string, string>;
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: (data: T) => void;
    onError?: (error: any) => void;
    onSuccessAction?: (data: T) => Action;
    onErrorAction?: (error: any) => Action;
  }
): string {
  return executeHttpRequest({
    ...options,
    url,
    method: 'PUT',
    body
  });
}

export function httpPatch<T>(
  url: string,
  body: any,
  options: {
    actionName: string;
    headers?: Record<string, string>;
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: (data: T) => void;
    onError?: (error: any) => void;
    onSuccessAction?: (data: T) => Action;
    onErrorAction?: (error: any) => Action;
  }
): string {
  return executeHttpRequest({
    ...options,
    url,
    method: 'PATCH',
    body
  });
}

export function httpDelete<T>(
  url: string,
  options: {
    actionName: string;
    params?: Record<string, any>;
    headers?: Record<string, string>;
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: (data: T) => void;
    onError?: (error: any) => void;
    onSuccessAction?: (data: T) => Action;
    onErrorAction?: (error: any) => Action;
  }
): string {
  return executeHttpRequest({
    ...options,
    url,
    method: 'DELETE'
  });
}

// Helper functions for checking state
export function isHttpLoading(requestId: string): boolean {
  const httpStore = inject(HttpStore);
  return httpStore.isLoading(requestId);
}

export function getHttpError(requestId: string): any {
  const httpStore = inject(HttpStore);
  return httpStore.getError(requestId);
}

export function clearHttpError(requestId: string): void {
  const store = inject(Store);
  store.dispatch(httpActions.clearError({ requestId }));
}
```