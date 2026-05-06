import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class BurlNavigationService {
  private readonly router = inject(Router);

  getBackUrl(fallbackUrl = '/'): string {
    const urlTree = this.router.parseUrl(this.router.url);
    return urlTree.queryParamMap.get('burl') ?? fallbackUrl;
  }

  async navigateBack(fallbackUrl = '/'): Promise<void> {
    await this.router.navigateByUrl(this.getBackUrl(fallbackUrl));
  }
}
