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
import { CustomerStore } from '../../../data/customer';
import { CurrencyStore } from '../../../../../features/management/data/currency/currency.store';

@Component({
  selector: 'app-view-customer',
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
  templateUrl: './view-customer.component.html',
  styleUrl: './view-customer.component.css',
})
export class ViewCustomerComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly burlNavigation = inject(BurlNavigationService);
  protected readonly customerStore = inject(CustomerStore);
  private readonly currencyStore = inject(CurrencyStore);

  protected readonly currencyLabel = computed(() => {
    const code = this.customerStore.selectedItem()?.currencycode;
    if (!code) return '—';
    const match = this.currencyStore.currencies().find((c) => c.code === code);
    return match ? `${match.name} (${match.symbol})` : code;
  });

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await Promise.all([
        this.customerStore.loadCustomerById(id),
        this.currencyStore.load(),
      ]);
    }
  }

  protected edit(): void {
    const id = this.customerStore.selectedItem()?.id;
    if (id) {
      void this.router.navigate(['/app/trading/customer', id, 'edit'], {
        queryParams: { burl: this.burlNavigation.getBackUrl() },
      });
    }
  }
}
