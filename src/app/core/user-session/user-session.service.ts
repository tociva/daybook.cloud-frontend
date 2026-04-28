import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { AuthConfig } from '../config/app-config.model';
import { UserSession, UserSessionSelectionId } from './user-session.model';

@Injectable({ providedIn: 'root' })
export class UserSessionService {
  private readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);

  async createUserSession(apiBaseUrl: string, authConfig: AuthConfig): Promise<UserSession> {
    return firstValueFrom(
      this.http.post<UserSession>(
        this.getUserSessionUrl(apiBaseUrl),
        {},
        await this.buildRequestOptions(authConfig),
      ),
    );
  }

  async selectBranch(
    apiBaseUrl: string,
    authConfig: AuthConfig,
    branchid: UserSessionSelectionId,
  ): Promise<UserSession> {
    return firstValueFrom(
      this.http.post<UserSession>(
        `${this.getUserSessionUrl(apiBaseUrl)}/select-branch`,
        { branchid },
        await this.buildRequestOptions(authConfig),
      ),
    );
  }

  async selectFiscalYear(
    apiBaseUrl: string,
    authConfig: AuthConfig,
    fiscalyearid: UserSessionSelectionId,
  ): Promise<UserSession> {
    return firstValueFrom(
      this.http.post<UserSession>(
        `${this.getUserSessionUrl(apiBaseUrl)}/select-fiscal-year`,
        { fiscalyearid },
        await this.buildRequestOptions(authConfig),
      ),
    );
  }

  async selectOrganization(
    apiBaseUrl: string,
    authConfig: AuthConfig,
    organizationid: UserSessionSelectionId,
  ): Promise<UserSession> {
    return firstValueFrom(
      this.http.post<UserSession>(
        `${this.getUserSessionUrl(apiBaseUrl)}/select-organization`,
        { organizationid },
        await this.buildRequestOptions(authConfig),
      ),
    );
  }

  async clearUserSession(apiBaseUrl: string, authConfig: AuthConfig): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(
        this.getUserSessionUrl(apiBaseUrl),
        await this.buildRequestOptions(authConfig),
      ),
    );
  }

  private async buildRequestOptions(authConfig: AuthConfig): Promise<{
    headers: HttpHeaders;
  }> {
    const accessToken = await this.authService.getAccessToken(authConfig);
    let headers = new HttpHeaders({ Accept: 'application/json' });

    if (accessToken) {
      headers = headers.set('Authorization', `Bearer ${accessToken}`);
    }

    return { headers };
  }

  private getUserSessionUrl(apiBaseUrl: string): string {
    return `${apiBaseUrl.replace(/\/$/, '')}/user/user-session`;
  }
}
