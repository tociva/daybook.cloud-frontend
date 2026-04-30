import { Component, inject, input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TngButtonComponent } from '@tailng-ui/components';

type BurlBackButtonAppearance = 'ghost' | 'outline' | 'solid';
type BurlBackButtonTone = 'danger' | 'neutral' | 'primary' | 'success';

@Component({
  selector: 'app-burl-back-button',
  imports: [TngButtonComponent],
  templateUrl: './burl-back-button.component.html',
})
export class BurlBackButtonComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly appearance = input<BurlBackButtonAppearance>('outline');
  readonly fallbackUrl = input('/');
  readonly label = input('Back');
  readonly tone = input<BurlBackButtonTone>('neutral');

  protected navigateBack(): void {
    const backUrl = this.route.snapshot.queryParamMap.get('burl') || this.fallbackUrl();
    void this.router.navigateByUrl(backUrl);
  }
}

