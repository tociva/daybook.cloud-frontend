import { Component, inject, input } from '@angular/core';
import { TngButtonComponent } from '@tailng-ui/components';
import { BurlNavigationService } from './burl-navigation.service';

type BurlBackButtonAppearance = 'ghost' | 'outline' | 'solid';
type BurlBackButtonTone = 'danger' | 'neutral' | 'primary' | 'success';

@Component({
  selector: 'app-burl-back-button',
  imports: [TngButtonComponent],
  templateUrl: './burl-back-button.component.html',
})
export class BurlBackButtonComponent {
  private readonly burlNavigation = inject(BurlNavigationService);

  readonly appearance = input<BurlBackButtonAppearance>('outline');
  readonly fallbackUrl = input('/app/dashboard');
  readonly label = input('Back');
  readonly tone = input<BurlBackButtonTone>('neutral');

  protected navigateBack(): void {
    void this.burlNavigation.navigateBack(this.fallbackUrl());
  }
}
