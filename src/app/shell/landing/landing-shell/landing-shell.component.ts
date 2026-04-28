import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { AppConfigStore } from '../../../core/config/app-config.store';
import { AppSystemStore } from '../../../core/system/app-system.store';
import {
  AuthNoticeAction,
  AuthNoticeCardComponent,
} from '../auth-notice-card/auth-notice-card.component';
import { LandingHeroComponent } from '../landing-hero/landing-hero.component';

@Component({
  selector: 'app-landing-shell',
  imports: [AuthNoticeCardComponent, LandingHeroComponent, RouterOutlet],
  templateUrl: './landing-shell.component.html',
  styleUrl: './landing-shell.component.css',
})
export class LandingShellComponent {
  private readonly systemStore = inject(AppSystemStore);
  private readonly authService = inject(AuthService);
  private readonly configStore = inject(AppConfigStore);
  protected readonly startupStatus = computed(() => this.systemStore.startupStatus());
  protected readonly startupError = computed(() => this.systemStore.error());
  protected readonly authNotice = computed(() => {
    const status = this.startupStatus();

    if (status === 'auth-provider-unavailable') {
      return {
        action: 'retry',
        buttonLabel: 'Try sign-in again',
        context: 'We will retry the Hydra discovery and sign-in redirect when you are ready.',
        message: this.startupError() ?? 'Authentication is temporarily unavailable.',
        showProgress: false,
        title: 'Authentication paused',
        tone: 'warning',
      } as const;
    }

    if (status === 'login-error') {
      return {
        action: 'retry',
        buttonLabel: 'Try sign-in again',
        context: 'The failed callback is paused so the browser does not loop back into login.',
        message: this.startupError() ?? 'Login failed. Please try signing in again.',
        showProgress: false,
        title: 'Sign-in failed',
        tone: 'danger',
      } as const;
    }

    if (
      status === 'login-success' ||
      status === 'session-active' ||
      status === 'loading-user-session' ||
      status === 'redirecting-to-bootstrap' ||
      status === 'redirecting-to-dashboard'
    ) {
      return {
        action: 'logout',
        buttonLabel: 'Logout',
        context: 'We are setting up your Daybook Cloud workspace and loading your account details.',
        message: 'Login successful. Your Daybook Cloud information is being loaded.',
        showProgress: true,
        title: 'Login success',
        tone: 'success',
      } as const;
    }

    if (status === 'user-session-error') {
      return {
        action: 'retry',
        buttonLabel: 'Try again',
        context: 'The OIDC login is valid, but the Daybook Cloud session could not be loaded.',
        message: this.startupError() ?? 'Unable to load your Daybook Cloud information.',
        showProgress: false,
        title: 'Workspace loading failed',
        tone: 'danger',
      } as const;
    }

    return null;
  });

  protected handleAuthNoticeAction(action: AuthNoticeAction): void {
    if (action === 'retry') {
      this.retryAuthentication();
      return;
    }

    const authConfig = this.configStore.activeAuth();

    if (!authConfig) {
      return;
    }

    void this.systemStore.logout();
  }

  private retryAuthentication(): void {
    const authConfig = this.configStore.activeAuth();

    if (authConfig) {
      this.authService.clearPausedProvider(authConfig);
      this.authService.clearLoginError(authConfig);
    }

    this.authService.clearLoginCallbackUrl();
    void this.systemStore.initialize();
  }
}

