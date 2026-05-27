import { Component, effect, inject, input, output, signal } from '@angular/core';
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
import {
  OrganizationService,
  type Organization,
  type OrganizationLogoVariant,
} from '../../../components/features/management/data/organization';
import { AppThemeStore } from '../../../core/theme/app-theme.store';
import { BreadcrumbItem } from '../workspace-nav.model';
import { WorkspaceSearchButtonComponent } from '../workspace-search-button/workspace-search-button.component';

const NORMAL_LOGO_CACHE_SUFFIX = '-normal-logo';

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
  private readonly organizationService = inject(OrganizationService);
  private activeOrganizationLogoRequestId = 0;
  private activeOrganizationLogoOrganizationId: string | null = null;
  private activeOrganizationLogoErrorRefreshCount = 0;

  readonly activeOrganizationName = input('No organization selected');
  readonly activeOrganizationLabel = input('Not set');
  readonly activeOrganizationId = input<string | null>(null);
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
  protected readonly activeOrganizationLogoSource = signal<string | null>(null);

  constructor() {
    effect(() => {
      void this.loadActiveOrganizationLogo(this.activeOrganizationId());
    });
  }

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

  protected onActiveOrganizationLogoError(): void {
    this.activeOrganizationLogoSource.set(null);

    if (this.activeOrganizationLogoErrorRefreshCount > 0) {
      return;
    }

    this.activeOrganizationLogoErrorRefreshCount += 1;
    void this.loadActiveOrganizationLogo(this.activeOrganizationId());
  }

  protected onActiveOrganizationLogoLoad(): void {
    this.activeOrganizationLogoErrorRefreshCount = 0;
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

  private async loadActiveOrganizationLogo(organizationId: string | null | undefined): Promise<void> {
    const requestId = ++this.activeOrganizationLogoRequestId;
    const trimmedOrganizationId = this.readString(organizationId);

    if (!trimmedOrganizationId) {
      this.activeOrganizationLogoOrganizationId = null;
      this.activeOrganizationLogoErrorRefreshCount = 0;
      this.activeOrganizationLogoSource.set(null);
      return;
    }

    if (trimmedOrganizationId !== this.activeOrganizationLogoOrganizationId) {
      this.activeOrganizationLogoOrganizationId = trimmedOrganizationId;
      this.activeOrganizationLogoErrorRefreshCount = 0;
      this.activeOrganizationLogoSource.set(this.readCachedNormalLogo(trimmedOrganizationId));
    }

    try {
      const organization = await this.organizationService.getById(trimmedOrganizationId);
      if (requestId !== this.activeOrganizationLogoRequestId) {
        return;
      }

      const variant = this.resolveLogoVariant(organization);

      if (!variant) {
        this.removeCachedNormalLogo(trimmedOrganizationId);
        this.activeOrganizationLogoSource.set(null);
        return;
      }

      if (variant !== 'normal') {
        this.removeCachedNormalLogo(trimmedOrganizationId);
      }

      const logo = await this.organizationService.getLogoReadUrl(trimmedOrganizationId, variant);
      if (requestId !== this.activeOrganizationLogoRequestId) {
        return;
      }

      const logoSource = this.readString(logo.getUrl);
      if (!logoSource) {
        this.activeOrganizationLogoSource.set(null);
        return;
      }

      if (variant !== 'normal') {
        this.activeOrganizationLogoSource.set(logoSource);
        return;
      }

      this.activeOrganizationLogoSource.set(logoSource);
      try {
        const base64Logo = await this.readImageAsDataUrl(logoSource);
        if (requestId !== this.activeOrganizationLogoRequestId) {
          return;
        }

        this.writeCachedNormalLogo(trimmedOrganizationId, base64Logo);
        this.activeOrganizationLogoSource.set(base64Logo);
      } catch {
        // Keep the signed URL visible even if the browser cannot cache it as base64.
      }
    } catch {
      // Preserve any cached logo already shown while the network/API request settles.
    }
  }

  private resolveLogoVariant(organization: Organization): OrganizationLogoVariant | null {
    if (this.readString(organization.normallogodocumentid)) {
      return 'normal';
    }

    if (this.readString(organization.smalllogodocumentid)) {
      return 'small';
    }

    return null;
  }

  private async readImageAsDataUrl(source: string): Promise<string> {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to fetch logo image (${response.status}).`);
    }

    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const result = reader.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Failed to read logo image.'));
        }
      });
      reader.addEventListener('error', () =>
        reject(reader.error ?? new Error('Failed to read logo image.')),
      );
      reader.readAsDataURL(blob);
    });
  }

  private normalLogoCacheKey(organizationId: string): string {
    return `${organizationId}${NORMAL_LOGO_CACHE_SUFFIX}`;
  }

  private readCachedNormalLogo(organizationId: string): string | null {
    try {
      return this.readString(localStorage.getItem(this.normalLogoCacheKey(organizationId)));
    } catch {
      return null;
    }
  }

  private writeCachedNormalLogo(organizationId: string, logo: string): void {
    try {
      localStorage.setItem(this.normalLogoCacheKey(organizationId), logo);
    } catch {
      // localStorage may be unavailable or over quota.
    }
  }

  private removeCachedNormalLogo(organizationId: string): void {
    try {
      localStorage.removeItem(this.normalLogoCacheKey(organizationId));
    } catch {
      // localStorage may be unavailable.
    }
  }

  private readString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
  }
}
