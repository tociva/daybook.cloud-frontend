import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  TngAvatarComponent,
  TngBreadcrumbComponent,
  TngBreadcrumbItemComponent,
  TngButtonComponent,
  TngMenuComponent,
  TngMenuTriggerFor,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { TngMenuGroupLabel, TngMenuItem, type TngMenuSelectEvent } from '@tailng-ui/primitives';
import { applyTailngTheme, defaultDarkThemePreset, defaultThemePreset } from '@tailng-ui/theme';
import { Organization } from '../../../components/features/management/data/organization/organization.model';
import { BreadcrumbItem } from '../workspace-nav.model';
import { WorkspaceSearchButtonComponent } from '../workspace-search-button/workspace-search-button.component';

@Component({
  selector: 'app-workspace-header',
  imports: [
    WorkspaceSearchButtonComponent,
    TngAvatarComponent,
    TngBreadcrumbComponent,
    TngBreadcrumbItemComponent,
    TngButtonComponent,
    TngIcon,
    TngMenuComponent,
    TngMenuTriggerFor,
    TngMenuGroupLabel,
    TngMenuItem,
  ],
  templateUrl: './workspace-header.component.html',
  styleUrl: './workspace-header.component.css',
})
export class WorkspaceHeaderComponent {
  private readonly router = inject(Router);
  readonly activeOrganizationName = input('No organization selected');
  readonly breadcrumbItems = input<readonly BreadcrumbItem[]>([
    { label: 'Home', routerLink: '/app/dashboard' },
    { label: 'Workspace', current: true },
  ]);
  readonly currentPageTitle = input('Workspace');
  readonly organizations = input<readonly Organization[]>([]);
  readonly userDisplayName = input('Daybook User');
  readonly logoutRequested = output<void>();
  public readonly darkMode = signal(true);
  public readonly effectiveMode = computed<'light' | 'dark'>(() =>
    this.darkMode() ? 'dark' : 'light',
  );
  protected readonly lastMenuCommand = signal<string | null>(null);

  constructor() {
    effect(() => {
      applyTailngTheme(this.darkMode() ? defaultDarkThemePreset : defaultThemePreset);
    });
  }

  public toggleMode(): void {
    this.darkMode.update((current) => !current);
  }

  public goToSelectOrganization(): void {
    void this.router.navigate(['/app/select-organization'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected logout(): void {
    this.logoutRequested.emit();
  }

  protected onProfileMenuSelect(event: TngMenuSelectEvent): void {
    const command = String(event.value);
    this.lastMenuCommand.set(command);

    if (command === 'logout') {
      this.logout();
    }
  }
}
