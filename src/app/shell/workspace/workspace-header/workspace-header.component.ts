import { Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import {
  TngAvatarComponent,
  TngBreadcrumbComponent,
  TngBreadcrumbItemComponent,
  TngMenuComponent,
  TngTooltipComponent,
  TngMenuTriggerFor,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { TngMenuGroupLabel, TngMenuItem, type TngMenuSelectEvent } from '@tailng-ui/primitives';
import { Organization } from '../../../components/features/management/data/organization/organization.model';
import { AppThemeStore } from '../../../core/theme/app-theme.store';
import { BreadcrumbItem } from '../workspace-nav.model';
import { WorkspaceSearchButtonComponent } from '../workspace-search-button/workspace-search-button.component';

@Component({
  selector: 'app-workspace-header',
  imports: [
    WorkspaceSearchButtonComponent,
    TngAvatarComponent,
    TngBreadcrumbComponent,
    TngBreadcrumbItemComponent,
    TngIcon,
    TngTooltipComponent,
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
  private readonly themeStore = inject(AppThemeStore);

  readonly activeOrganizationName = input('No organization selected');
  readonly activeOrganizationLabel = input('Not set');
  readonly activeBranchName = input('Not set');
  readonly activeFiscalYearName = input('Not set');
  readonly breadcrumbItems = input<readonly BreadcrumbItem[]>([
    { label: 'Home', routerLink: '/app/dashboard' },
    { label: 'Workspace', current: true },
  ]);
  readonly currentPageTitle = input('Workspace');
  readonly organizations = input<readonly Organization[]>([]);
  readonly userDisplayName = input('Daybook User');
  readonly logoutRequested = output<void>();

  public goToSelectOrganization(): void {
    void this.router.navigate(['/app/select-organization'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected onOrgTooltipTriggerClick(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    if (!target.closest('.tng-tooltip-trigger')) {
      return;
    }

    this.goToSelectOrganization();
  }

  protected goToProfile(): void {
    void this.router.navigate(['/app/profile']);
  }

  protected logout(): void {
    this.logoutRequested.emit();
  }

  protected onProfileMenuSelect(event: TngMenuSelectEvent): void {
    const command = String(event.value);

    if (command === 'logout') {
      this.logout();
    } else if (command === 'profile') {
      this.goToProfile();
    }
  }
}
