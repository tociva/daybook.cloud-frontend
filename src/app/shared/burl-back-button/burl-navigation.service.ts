import { Injectable, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class BurlNavigationService {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  getBackUrl(fallbackUrl = '/'): string {
    return this.route.snapshot.queryParamMap.get('burl') || fallbackUrl;
  }

  async navigateBack(fallbackUrl = '/'): Promise<void> {
    await this.router.navigateByUrl(this.getBackUrl(fallbackUrl));
  }
}
