import { Component, effect, inject } from '@angular/core';
import { AuthService } from '../../data/auth.service';
import { AppConfigStore } from '../../../../../core/config/app-config.store';

@Component({
  selector: 'app-silent-renew',
  template: '',
})
export class SilentRenewComponent {
  private readonly authService = inject(AuthService);
  private readonly appConfigStore = inject(AppConfigStore);
  private hasHandledCallback = false;

  private readonly callbackEffect = effect(() => {
    if (this.hasHandledCallback) {
      return;
    }

    void this.handleSilentRenewCallback();
  });

  private async handleSilentRenewCallback(): Promise<void> {
    if (this.hasHandledCallback) {
      return;
    }

    this.hasHandledCallback = true;

    try {
      const config = this.appConfigStore.config() ?? (await this.appConfigStore.load());

      if (!config) {
        return;
      }

      await this.authService.completeSilentRenew(config.auth);
    } catch (error) {
      console.warn('[Auth] Silent renew callback failed.', error);
    }
  }
}
