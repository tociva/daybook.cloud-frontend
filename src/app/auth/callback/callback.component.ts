import { Component, OnDestroy, computed, effect, inject } from '@angular/core';
import { AppStartupStatus } from '../../core/system/app-system.model';
import { AppSystemStore } from '../../core/system/app-system.store';

@Component({
  selector: 'app-auth-callback',
  templateUrl: './callback.component.html',
  styleUrl: './callback.component.css',
})
export class CallbackComponent implements OnDestroy {
  private readonly systemStore = inject(AppSystemStore);
  private hasStartedCallback = false;
  protected readonly status = computed(() => this.systemStore.startupStatus());
  protected readonly error = computed(() => this.systemStore.error());
  protected readonly title = computed(() =>
    this.status() === 'login-error' ? 'Sign-in failed' : 'Completing sign-in',
  );
  protected readonly message = computed(() => this.buildMessage(this.status(), this.error()));

  private readonly callbackEffect = effect(() => {
    const status = this.status();

    if (status === 'idle' && !this.hasStartedCallback) {
      this.hasStartedCallback = true;
      queueMicrotask(() => void this.systemStore.handleLoginCallback());
      return;
    }
  });

  ngOnDestroy(): void {
    this.callbackEffect.destroy();
  }

  private buildMessage(status: AppStartupStatus, error: string | null): string {
    if (status === 'login-error') {
      return error ?? 'Login failed. Please try signing in again.';
    }

    if (status === 'login-success') {
      return 'Login completed. Loading your Daybook Cloud workspace...';
    }

    if (status === 'loading-user-session') {
      return 'Fetching your Daybook Cloud account details...';
    }

    return 'Please wait while we verify the authorization response.';
  }
}
