import { DOCUMENT } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TngButtonComponent } from '@tailng-ui/components';
import { fromEvent } from 'rxjs';
import { filter } from 'rxjs/operators';
import { BurlNavigationService } from './burl-navigation.service';

type BurlBackButtonAppearance = 'ghost' | 'outline' | 'solid';
type BurlBackButtonTone = 'danger' | 'neutral' | 'primary' | 'success';

const BLOCKING_OVERLAY_SELECTOR = [
  '.tng-dialog-backdrop',
  '[tngDialogBackdrop]',
  '[data-slot="popover-panel"][data-state="open"]',
].join(', ');

@Component({
  selector: 'app-burl-back-button',
  imports: [TngButtonComponent],
  templateUrl: './burl-back-button.component.html',
})
export class BurlBackButtonComponent {
  private readonly document = inject(DOCUMENT);
  private readonly burlNavigation = inject(BurlNavigationService);

  readonly appearance = input<BurlBackButtonAppearance>('outline');
  readonly escapeEnabled = input(true);
  readonly fallbackUrl = input('/app/dashboard');
  readonly label = input('Back');
  readonly tone = input<BurlBackButtonTone>('neutral');

  constructor() {
    fromEvent<KeyboardEvent>(this.document, 'keydown')
      .pipe(
        filter((event) => event.key === 'Escape'),
        filter(() => this.escapeEnabled()),
        takeUntilDestroyed(),
      )
      .subscribe((event) => this.onEscape(event));
  }

  protected navigateBack(): void {
    void this.burlNavigation.navigateBack(this.fallbackUrl());
  }

  private onEscape(event: KeyboardEvent): void {
    if (event.defaultPrevented) return;
    if (this.isBlockingOverlayOpen()) return;

    event.preventDefault();
    this.navigateBack();
  }

  private isBlockingOverlayOpen(): boolean {
    return this.document.querySelector(BLOCKING_OVERLAY_SELECTOR) !== null;
  }
}
