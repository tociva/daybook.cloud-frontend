import { HttpClient, HttpContext, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ProgressStore } from '../progress/progress.store';

type PrimitiveParam = string | number | boolean;

export type ApiRequestOptions = Readonly<{
  context?: HttpContext;
  headers?: HttpHeaders | Record<string, string | string[]>;
  params?: HttpParams | Record<string, PrimitiveParam | readonly PrimitiveParam[]>;
  reportProgress?: boolean;
  withCredentials?: boolean;
}>;

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly http = inject(HttpClient);
  private readonly progressStore = inject(ProgressStore);

  async get<TResponse>(url: string, options?: ApiRequestOptions): Promise<TResponse> {
    return this.withProgress(() => firstValueFrom(this.http.get<TResponse>(url, options)));
  }

  async post<TResponse, TBody>(
    url: string,
    body: TBody,
    options?: ApiRequestOptions,
  ): Promise<TResponse> {
    return this.withProgress(() => firstValueFrom(this.http.post<TResponse>(url, body, options)));
  }

  async put<TResponse, TBody>(
    url: string,
    body: TBody,
    options?: ApiRequestOptions,
  ): Promise<TResponse> {
    return this.withProgress(() => firstValueFrom(this.http.put<TResponse>(url, body, options)));
  }

  async patch<TResponse, TBody>(
    url: string,
    body: TBody,
    options?: ApiRequestOptions,
  ): Promise<TResponse> {
    return this.withProgress(() => firstValueFrom(this.http.patch<TResponse>(url, body, options)));
  }

  async delete<TResponse>(url: string, options?: ApiRequestOptions): Promise<TResponse> {
    return this.withProgress(() => firstValueFrom(this.http.delete<TResponse>(url, options)));
  }

  private async withProgress<T>(request: () => Promise<T>): Promise<T> {
    this.progressStore.show();
    try {
      return await request();
    } finally {
      this.progressStore.hideOne();
    }
  }
}
