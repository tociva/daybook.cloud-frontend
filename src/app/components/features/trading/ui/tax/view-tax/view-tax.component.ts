import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  TngCardActionsComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardFooterComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
  TngTag,
} from '@tailng-ui/components';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlEditButtonComponent } from '../../../../../../shared/burl-edit-button/burl-edit-button.component';
import { BurlNavigationService } from '../../../../../../shared/burl-back-button/burl-navigation.service';
import { Status, TaxStore } from '../../../data/tax';
import type { Tax } from '../../../data/tax';
import { TngTagIcon } from '../../bank-cash/tng-tag-icon.directive';

type StatusTagTone = 'danger' | 'success' | 'warning';

@Component({
  selector: 'app-view-tax',
  imports: [
    TngCardActionsComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardFooterComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    TngTag,
    TngTagIcon,
    BurlBackButtonComponent,
    BurlEditButtonComponent,
  ],
  templateUrl: './view-tax.component.html',
  styleUrl: './view-tax.component.css',
})
export class ViewTaxComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly burlNavigation = inject(BurlNavigationService);
  protected readonly taxStore = inject(TaxStore);

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    if (this.taxStore.selectedItem()?.id === id) return;
    await this.taxStore.loadTaxById(id);
  }

  protected edit(): void {
    const id = this.taxStore.selectedItem()?.id;
    if (id) {
      void this.router.navigate(['/app/trading/tax', id, 'edit'], {
        queryParams: { burl: this.burlNavigation.getBackUrl() },
      });
    }
  }

  protected getStatusLabel(status: Tax['status']): string {
    switch (status) {
      case Status.INACTIVE:
        return 'Inactive';
      case Status.DELETED:
        return 'Deleted';
      case Status.ACTIVE:
      case undefined:
        return 'Active';
      default:
        return String(status);
    }
  }

  protected getStatusTone(status: Tax['status']): StatusTagTone {
    switch (status) {
      case Status.INACTIVE:
        return 'warning';
      case Status.DELETED:
        return 'danger';
      case Status.ACTIVE:
      case undefined:
      default:
        return 'success';
    }
  }
}
