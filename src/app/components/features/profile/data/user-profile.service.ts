import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '../../../../core/api/api-client.service';
import { AppConfigStore } from '../../../../core/config/app-config.store';

export interface UserProfilePayload {
  ledgerCache?: boolean;
  mode?: string;
  theme?: string;
}

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private readonly api = inject(ApiClientService);
  private readonly appConfigStore = inject(AppConfigStore);

  async updateProfile(payload: UserProfilePayload): Promise<void> {
    const config = this.appConfigStore.config() ?? (await this.appConfigStore.load());
    if (!config) {
      throw new Error('Unable to load app configuration.');
    }

    const url = `${config.apiBaseUrl.replace(/\/$/, '')}/user/profile`;
    await this.api.patch<void, UserProfilePayload>(url, payload);
  }
}
