import { Component, OnDestroy, effect, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { AppConfigStore } from '../../core/config/app-config.store';

@Component({
  selector: 'app-silent-renew',
  template: '',
})
export class SilentRenewComponent implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly appConfigStore = inject(AppConfigStore);
  private hasHandledCallback = false;

  private readonly callbackEffect = effect(() => {
    if (this.hasHandledCallback) {
      return;
    }

    const authConfig = this.appConfigStore.activeAuth();
    if (!authConfig) {
      return;
    }

    this.hasHandledCallback = true;
    void this.authService.completeSilentRenew(authConfig);
  });

  ngOnDestroy(): void {
    this.callbackEffect.destroy();
  }
}

