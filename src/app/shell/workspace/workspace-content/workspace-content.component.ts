import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  NavigationStart,
  Router,
  RouterOutlet,
} from '@angular/router';
import { TngSkeletonComponent } from '@tailng-ui/components';

@Component({
  selector: 'app-workspace-content',
  imports: [RouterOutlet, TngSkeletonComponent],
  templateUrl: './workspace-content.component.html',
  styleUrl: './workspace-content.component.css',
})
export class WorkspaceContentComponent {
  private readonly router = inject(Router);
  private readonly routeLoading = signal(false);
  private activeNavigationId: number | null = null;

  protected readonly isRouteLoading = this.routeLoading.asReadonly();
  protected readonly skeletonActions = [0, 1, 2] as const;
  protected readonly skeletonRows = [0, 1, 2, 3, 4] as const;

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.handleNavigationStart(event);
        return;
      }

      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError ||
        event instanceof NavigationSkipped
      ) {
        this.handleNavigationComplete(event.id);
      }
    });
  }

  private handleNavigationStart(event: NavigationStart): void {
    if (this.normalizePath(event.url) === this.normalizePath(this.router.url)) {
      if (this.activeNavigationId === event.id) {
        this.handleNavigationComplete(event.id);
      }
      return;
    }

    this.activeNavigationId = event.id;
    this.routeLoading.set(true);
  }

  private handleNavigationComplete(navigationId: number): void {
    if (this.activeNavigationId !== navigationId) {
      return;
    }

    this.activeNavigationId = null;
    this.routeLoading.set(false);
  }

  private normalizePath(url: string): string {
    const path = url.split(/[?#]/)[0] ?? '/';
    return path.replace(/\/+$/, '') || '/';
  }
}
