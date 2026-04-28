import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AppSystemStore } from '../../../core/system/app-system.store';
import { UserSessionStore } from '../../../core/user-session/user-session.store';
import { WorkspaceContentComponent } from '../workspace-content/workspace-content.component';
import { WorkspaceHeaderComponent } from '../workspace-header/workspace-header.component';
import { WorkspaceNavItem } from '../workspace-nav.model';
import { WorkspaceSidebarComponent } from '../workspace-sidebar/workspace-sidebar.component';

const workspaceNavItems: readonly WorkspaceNavItem[] = [
  {
    description: 'Overview and activity',
    label: 'Dashboard',
    path: '/app/dashboard',
    shortcut: 'D',
  },
  {
    description: 'Create or complete setup',
    label: 'Organization Setup',
    path: '/bootstrap/bootstrap-organization',
    shortcut: 'O',
  },
];

@Component({
  selector: 'app-workspace-shell',
  imports: [WorkspaceContentComponent, WorkspaceHeaderComponent, WorkspaceSidebarComponent],
  templateUrl: './workspace-shell.component.html',
  styleUrl: './workspace-shell.component.css',
})
export class WorkspaceShellComponent {
  private readonly systemStore = inject(AppSystemStore);
  private readonly router = inject(Router);
  private readonly userSessionStore = inject(UserSessionStore);
  private readonly currentUrl = signal(this.router.url);
  protected readonly workspaceNavItems = workspaceNavItems;
  protected readonly organizations = computed(() => this.userSessionStore.session()?.ownorgs ?? []);
  protected readonly activeOrganizationName = computed(() => {
    const organization = this.organizations()[0];
    return organization?.name ?? 'No organization selected';
  });
  protected readonly userDisplayName = computed(() => {
    const session = this.userSessionStore.session();
    const name =
      this.readString(session?.['displayname']) ??
      this.readString(session?.['displayName']) ??
      this.readString(session?.['name']) ??
      this.readString(session?.['username']);

    return name ?? 'Daybook User';
  });
  protected readonly currentPageTitle = computed(() => {
    const path = this.currentUrl().split('?')[0] ?? '/';
    const item = this.workspaceNavItems.find((navItem) => navItem.path === path);

    return item?.label ?? 'Workspace';
  });

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => this.currentUrl.set(event.urlAfterRedirects));
  }

  protected logout(): void {
    void this.systemStore.logout();
  }

  private readString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
  }
}

