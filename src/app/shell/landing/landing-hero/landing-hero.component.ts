import { Component, inject, signal } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';

const WORDMARK_LOGO_SOURCE = '/assets/logo/daybook-cloud-logo-wordmark.svg';

@Component({
  selector: 'app-landing-hero',
  templateUrl: './landing-hero.component.html',
  styleUrl: './landing-hero.component.css',
})
export class LandingHeroComponent {
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly wordmarkLogoSvg = signal<SafeHtml | null>(null);

  constructor() {
    void this.loadWordmarkLogo();
  }

  private async loadWordmarkLogo(): Promise<void> {
    try {
      const response = await fetch(WORDMARK_LOGO_SOURCE, { cache: 'force-cache' });
      if (!response.ok) {
        throw new Error(`Failed to fetch wordmark logo (${response.status}).`);
      }

      this.wordmarkLogoSvg.set(
        this.sanitizer.bypassSecurityTrustHtml(await response.text()),
      );
    } catch {
      // Keep the static image fallback visible if the SVG cannot be loaded.
    }
  }
}
