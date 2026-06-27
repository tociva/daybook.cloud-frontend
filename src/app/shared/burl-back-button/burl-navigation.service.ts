import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PermissionsStore } from '../../core/permissions/permissions.store';

@Injectable({ providedIn: 'root' })
export class BurlNavigationService {
  private readonly router = inject(Router);
  private readonly permissions = inject(PermissionsStore);

  getBackUrl(fallbackUrl?: string): string {
    const urlTree = this.router.parseUrl(this.router.url);
    return urlTree.queryParamMap.get('burl') ?? fallbackUrl ?? this.permissions.firstAllowedWorkspaceRoute();
  }

  async navigateBack(fallbackUrl?: string): Promise<void> {
    await this.router.navigateByUrl(this.getBackUrl(fallbackUrl));
  }
}
