import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class BurlNavigationService {
  private readonly router = inject(Router);

  getBackUrl(fallbackUrl = '/app/dashboard'): string {
    const urlTree = this.router.parseUrl(this.router.url);
    return urlTree.queryParamMap.get('burl') ?? fallbackUrl;
  }

  async navigateBack(fallbackUrl = '/app/dashboard'): Promise<void> {
    await this.router.navigateByUrl(this.getBackUrl(fallbackUrl));
  }
}
