import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { TngToastComponent } from '@tailng-ui/components';
import { filter } from 'rxjs';
import { AuthService } from './core/auth/auth.service';
import { AppSystemStore } from './core/system/app-system.store';
import { AppToastTone } from './core/toast/toast.model';
import { ToastStore } from './core/toast/toast.store';
import { LandingShellComponent } from './shell/landing/landing-shell/landing-shell.component';
import { WorkspaceShellComponent } from './shell/workspace/workspace-shell/workspace-shell.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  imports: [LandingShellComponent, TngToastComponent, WorkspaceShellComponent],
})
export class App {
  private readonly systemStore = inject(AppSystemStore);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastStore = inject(ToastStore);
  private readonly currentUrl = signal(this.router.url);
  protected readonly toast = viewChild<TngToastComponent>('toast');
  private readonly startupStatus = computed(() => this.systemStore.startupStatus());
  private readonly toastEvents = computed(() => this.toastStore.events());
  protected readonly showLanding = computed(() => {
    const path = this.currentUrl().split('?')[0] ?? '/';
    return path === '/' || path === '/auth/callback';
  });
  private lastShownToastId = 0;

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => this.currentUrl.set(event.urlAfterRedirects));

    effect(() => {
      if (this.startupStatus() === 'idle' && !this.authService.isCurrentLoginCallbackUrl()) {
        queueMicrotask(() => void this.systemStore.initialize());
      }
    });

    effect(() => {
      const toast = this.toast();
      const events = this.toastEvents();

      if (!toast || events.length === 0) {
        return;
      }

      for (const event of events) {
        if (event.id <= this.lastShownToastId) {
          continue;
        }

        this.showToast(event.tone, event.message, {
          duration: event.duration,
          title: event.title,
        });
        this.lastShownToastId = event.id;
      }
    });
  }

  private showToast(
    tone: AppToastTone,
    message: string,
    options: { duration?: number; title?: string | null } = {},
  ): void {
    const toast = this.toast() as
      | {
          show?: (
            message: string,
            options?: { duration?: number; title?: string | null; tone?: AppToastTone },
          ) => void;
        }
      | undefined;
    if (!toast) {
      return;
    }

    if (typeof toast.show === 'function') {
      toast.show(message, { ...options, tone });
    }
  }
}
