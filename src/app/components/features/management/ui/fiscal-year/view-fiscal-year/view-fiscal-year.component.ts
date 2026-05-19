import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
import { FiscalYearStore } from '../../../data/fiscal-year';
import { DateManagementService } from '../../../../../../core/date/date-management.service';

@Component({
  selector: 'app-view-fiscal-year',
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
  templateUrl: './view-fiscal-year.component.html',
  styleUrl: './view-fiscal-year.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewFiscalYearComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly burlNavigation = inject(BurlNavigationService);
  private readonly dateManagement = inject(DateManagementService);
  protected readonly fiscalYearStore = inject(FiscalYearStore);
  protected readonly formatDate = (value: string | null | undefined): string =>
    this.dateManagement.formatDisplayDate(value);

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    this.fiscalYearStore.clearError();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.fiscalYearStore.loadFiscalYearById(id, { includes: ['branch', 'currency'] });
    }
  }

  protected edit(): void {
    const id = this.fiscalYearStore.selectedItem()?.id;
    if (id) {
      void this.router.navigate(['/app/management/fiscal-year', id, 'edit'], {
        queryParams: { burl: this.burlNavigation.getBackUrl() },
      });
    }
  }

  protected delete(): void {
    const id = this.fiscalYearStore.selectedItem()?.id;
    if (id) {
      void this.router.navigate(['/app/management/fiscal-year', id, 'delete'], {
        queryParams: { burl: this.burlNavigation.getBackUrl() },
      });
    }
  }
}
