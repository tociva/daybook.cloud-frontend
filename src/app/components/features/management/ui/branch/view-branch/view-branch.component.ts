import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
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
import { BurlDeleteButtonComponent } from '../../../../../../shared/burl-delete-button/burl-delete-button.component';
import { BurlEditButtonComponent } from '../../../../../../shared/burl-edit-button/burl-edit-button.component';
import { BurlNavigationService } from '../../../../../../shared/burl-back-button/burl-navigation.service';
import { BranchStore } from '../../../data/branch';
import type { Branch } from '../../../data/branch';
import { CountryStore } from '../../../data/country/country.store';
import { CurrencyStore } from '../../../data/currency/currency.store';

@Component({
  selector: 'app-view-branch',
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
    BurlDeleteButtonComponent,
    BurlEditButtonComponent,
  ],
  templateUrl: './view-branch.component.html',
  styleUrl: './view-branch.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewBranchComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly burlNavigation = inject(BurlNavigationService);
  private readonly countryStore = inject(CountryStore);
  private readonly currencyStore = inject(CurrencyStore);
  protected readonly branchStore = inject(BranchStore);
  private readonly countriesByCode = computed(
    () => new Map(this.countryStore.countries().map((country) => [country.code, country.name])),
  );
  private readonly currenciesByCode = computed(
    () =>
      new Map(
        this.currencyStore
          .currencies()
          .map((currency) => [currency.code, `${currency.name} (${currency.symbol})`]),
      ),
  );

  constructor() {
    this.loadReferenceData();
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    this.branchStore.clearError();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.branchStore.loadBranchById(id, { includes: ['organization', 'country'] });
    }
  }

  protected countryLabel(branch: Branch): string {
    return (
      branch.country?.name ??
      this.countriesByCode().get(branch.countrycode) ??
      branch.countrycode ??
      '—'
    );
  }

  protected currencyLabel(branch: Branch): string {
    return this.currenciesByCode().get(branch.currencycode) ?? branch.currencycode ?? '—';
  }

  private loadReferenceData(): void {
    if (!this.countryStore.hasCountries()) {
      void this.countryStore.load();
    }

    if (!this.currencyStore.hasCurrencies()) {
      void this.currencyStore.load();
    }
  }

  protected edit(): void {
    const id = this.branchStore.selectedItem()?.id;
    if (id) {
      void this.router.navigate(['/app/management/branch', id, 'edit'], {
        queryParams: { burl: this.burlNavigation.getBackUrl() },
      });
    }
  }

  protected delete(): void {
    const id = this.branchStore.selectedItem()?.id;
    if (id) {
      void this.router.navigate(['/app/management/branch', id, 'delete'], {
        queryParams: { burl: this.burlNavigation.getBackUrl() },
      });
    }
  }
}
