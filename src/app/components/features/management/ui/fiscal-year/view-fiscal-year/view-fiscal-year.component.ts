import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  TngButtonComponent,
  TngCardActionsComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardFooterComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlNavigationService } from '../../../../../../shared/burl-back-button/burl-navigation.service';
import { FiscalYearStore } from '../../../data/fiscal-year';
import { formatDisplayDate } from '../../../../../../core/date/dayjs-date.utils';

@Component({
  selector: 'app-view-fiscal-year',
  standalone: true,
  imports: [
    TngButtonComponent,
    TngCardActionsComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardFooterComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    TngIcon,
    BurlBackButtonComponent,
  ],
  templateUrl: './view-fiscal-year.component.html',
  styleUrl: './view-fiscal-year.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewFiscalYearComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly burlNavigation = inject(BurlNavigationService);
  protected readonly fiscalYearStore = inject(FiscalYearStore);
  protected readonly formatDate = formatDisplayDate;

  async ngOnInit(): Promise<void> {
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
