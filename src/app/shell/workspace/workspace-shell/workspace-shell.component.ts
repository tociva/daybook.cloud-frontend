import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AppSystemStore } from '../../../core/system/app-system.store';
import { UserSessionStore } from '../../../components/features/management/data/user-session/user-session.store';
import { WorkspaceContentComponent } from '../workspace-content/workspace-content.component';
import { WorkspaceHeaderComponent } from '../workspace-header/workspace-header.component';
import { BreadcrumbItem, WorkspaceNavItem, workspaceSidebarMenu } from '../workspace-nav.model';
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
    const session = this.userSessionStore.session();
    const branchName = this.readString(session?.branch?.name);
    const fiscalYearName = this.readString(session?.fiscalyear?.name);
    const organizationName = this.readString(session?.organization?.name);

    if (branchName && fiscalYearName) {
      return `${branchName}@${fiscalYearName}`;
    }

    if (branchName) {
      return branchName;
    }

    if (organizationName) {
      return organizationName;
    }

    return 'No organization selected';
  });
  protected readonly userDisplayName = computed(() => {
    const session = this.userSessionStore.session();
    const name =
      this.readString(session?.displayname) ??
      this.readString(session?.displayName) ??
      this.readString(session?.name) ??
      this.readString(session?.username);

    return name ?? 'Daybook User';
  });
  protected readonly breadcrumbItems = computed((): readonly BreadcrumbItem[] => {
    const path = this.currentUrl().split('?')[0] ?? '/';

    // Check top-level nav items first (Dashboard, Organization Setup, etc.)
    const topLevelMatch = this.workspaceNavItems.find((navItem) => navItem.path === path);
    if (topLevelMatch) {
      return [
        { label: 'Home', routerLink: '/app/dashboard' },
        { label: topLevelMatch.label, current: true },
      ];
    }

    // Check sidebar menu groups (e.g. /app/trading/bank-cash)
    for (const group of workspaceSidebarMenu) {
      const groupBase = `/app/${group.path}`;

      if (!group.children) {
        if (path === groupBase) {
          return [
            { label: 'Home', routerLink: '/app/dashboard' },
            { label: group.name, current: true },
          ];
        }
        continue;
      }

      const groupDefaultPath = group.defaultPath ?? group.children[0]?.path;
      const groupHref = groupDefaultPath ? `${groupBase}/${groupDefaultPath}` : groupBase;

      for (const child of group.children) {
        const childPath = `${groupBase}/${child.path}`;
        if (path === childPath || path.startsWith(`${childPath}/`)) {
          return [
            { label: 'Home', routerLink: '/app/dashboard' },
            { label: group.name, routerLink: groupHref },
            { label: child.name, current: true },
          ];
        }
      }
    }

    return [
      { label: 'Home', routerLink: '/app/dashboard' },
      { label: 'Workspace', current: true },
    ];
  });

  protected readonly currentPageTitle = computed(() => {
    const items = this.breadcrumbItems();
    const current = items.find((item) => item.current);
    return current?.label ?? 'Workspace';
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

