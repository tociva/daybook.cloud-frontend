import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
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
import { BurlNavigationService } from '../../../../../../shared/burl-back-button/burl-navigation.service';
import { LedgerCategoryStore } from '../../../data/ledger-category';

@Component({
  selector: 'app-delete-ledger-category',
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
  templateUrl: './delete-ledger-category.component.html',
  styleUrl: './delete-ledger-category.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteLedgerCategoryComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly burlNavigation = inject(BurlNavigationService);
  protected readonly ledgerCategoryStore = inject(LedgerCategoryStore);
  protected readonly confirmed = signal(false);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.ledgerCategoryStore.loadLedgerCategoryById(id, { includes: ['parent'] });
    }
  }

  protected async deleteLedgerCategory(): Promise<void> {
    const id = this.ledgerCategoryStore.selectedItem()?.id;
    if (!id || !this.confirmed()) return;

    const deleted = await this.ledgerCategoryStore.deleteLedgerCategory(id);
    if (deleted) {
      await this.burlNavigation.navigateBack();
    }
  }
}
