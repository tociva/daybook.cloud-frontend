import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  TngCardActionsComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardFooterComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
} from '@tailng-ui/components';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlEditButtonComponent } from '../../../../../../shared/burl-edit-button/burl-edit-button.component';
import { BurlNavigationService } from '../../../../../../shared/burl-back-button/burl-navigation.service';
import { VendorStore } from '../../../data/vendor';
import { CountryStore } from '../../../../../features/management/data/country/country.store';
import { CurrencyStore } from '../../../../../features/management/data/currency/currency.store';

@Component({
  selector: 'app-view-vendor',
  standalone: true,
  imports: [
    TngCardActionsComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardFooterComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    BurlBackButtonComponent,
    BurlEditButtonComponent,
  ],
  templateUrl: './view-vendor.component.html',
  styleUrls: ['./view-vendor.component.css', '../../../../../../../styles/flags.css'],
})
export class ViewVendorComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly burlNavigation = inject(BurlNavigationService);
  protected readonly vendorStore = inject(VendorStore);
  private readonly countryStore = inject(CountryStore);
  private readonly currencyStore = inject(CurrencyStore);

  protected readonly country = computed(() => {
    const code = this.vendorStore.selectedItem()?.countrycode;
    if (!code) return null;
    return this.countryStore.countries().find((c) => c.code === code) ?? null;
  });

  protected readonly currencyLabel = computed(() => {
    const code = this.vendorStore.selectedItem()?.currencycode;
    if (!code) return '—';
    const match = this.currencyStore.currencies().find((c) => c.code === code);
    return match ? `${match.name} (${match.symbol})` : code;
  });

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    this.vendorStore.clearError();

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    const skipVendorFetch = this.vendorStore.selectedItem()?.id === id;
    await Promise.all([
      skipVendorFetch ? Promise.resolve(null) : this.vendorStore.loadVendorById(id),
      this.countryStore.load(),
      this.currencyStore.load(),
    ]);
  }

  protected edit(): void {
    const id = this.vendorStore.selectedItem()?.id;
    if (id) {
      void this.router.navigate(['/app/trading/vendor', id, 'edit'], {
        queryParams: { burl: this.burlNavigation.getBackUrl() },
      });
    }
  }
}
