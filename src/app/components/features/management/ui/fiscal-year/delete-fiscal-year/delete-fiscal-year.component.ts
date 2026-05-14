import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  TngButtonComponent,
  TngCardActionsComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardFooterComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
  TngCheckboxComponent,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { FiscalYearFacade, FiscalYearStore } from '../../../data/fiscal-year';
import { DateManagementService } from '../../../../../../core/date/date-management.service';

@Component({
  selector: 'app-delete-fiscal-year',
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
    TngCheckboxComponent,
    TngIcon,
    BurlBackButtonComponent,
  ],
  templateUrl: './delete-fiscal-year.component.html',
  styleUrl: './delete-fiscal-year.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteFiscalYearComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(FiscalYearFacade);
  private readonly dateManagement = inject(DateManagementService);
  protected readonly fiscalYearStore = inject(FiscalYearStore);
  protected readonly confirmed = signal(false);
  protected readonly formatDate = (value: string | null | undefined): string =>
    this.dateManagement.formatDisplayDate(value);

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.fiscalYearStore.loadFiscalYearById(id, { includes: ['branch'] });
    }
  }

  protected async deleteFiscalYear(): Promise<void> {
    const id = this.fiscalYearStore.selectedItem()?.id;
    if (!id || !this.confirmed()) return;

    await this.facade.delete(id);
  }
}
