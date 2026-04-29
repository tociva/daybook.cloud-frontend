import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { UserSession } from './user-session.model';

type UserSessionSelectionId = number | string;

@Injectable({ providedIn: 'root' })
export class UserSessionService {
  private readonly http = inject(HttpClient);

  async createUserSession(apiBaseUrl: string): Promise<UserSession> {
    return firstValueFrom(
      this.http.post<UserSession>(
        this.getUserSessionUrl(apiBaseUrl),
        {},
        this.buildRequestOptions(),
      ),
    );
  }

  async selectBranch(
    apiBaseUrl: string,
    branchid: UserSessionSelectionId,
  ): Promise<UserSession> {
    return firstValueFrom(
      this.http.post<UserSession>(
        `${this.getUserSessionUrl(apiBaseUrl)}/select-branch`,
        { branchid },
        this.buildRequestOptions(),
      ),
    );
  }

  async selectFiscalYear(
    apiBaseUrl: string,
    fiscalyearid: UserSessionSelectionId,
  ): Promise<UserSession> {
    return firstValueFrom(
      this.http.post<UserSession>(
        `${this.getUserSessionUrl(apiBaseUrl)}/select-fiscal-year`,
        { fiscalyearid },
        this.buildRequestOptions(),
      ),
    );
  }

  async selectOrganization(
    apiBaseUrl: string,
    organizationid: UserSessionSelectionId,
  ): Promise<UserSession> {
    return firstValueFrom(
      this.http.post<UserSession>(
        `${this.getUserSessionUrl(apiBaseUrl)}/select-organization`,
        { organizationid },
        this.buildRequestOptions(),
      ),
    );
  }

  async clearUserSession(apiBaseUrl: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(this.getUserSessionUrl(apiBaseUrl), this.buildRequestOptions()),
    );
  }

  private buildRequestOptions(): {
    headers: HttpHeaders;
  } {
    return { headers: new HttpHeaders({ Accept: 'application/json' }) };
  }

  private getUserSessionUrl(apiBaseUrl: string): string {
    return `${apiBaseUrl.replace(/\/$/, '')}/user/user-session`;
  }
}
