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
import { LedgerStore } from '../../../data/ledger';

@Component({
  selector: 'app-delete-ledger',
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
  templateUrl: './delete-ledger.component.html',
  styleUrl: './delete-ledger.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteLedgerComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly burlNavigation = inject(BurlNavigationService);
  protected readonly ledgerStore = inject(LedgerStore);
  protected readonly confirmed = signal(false);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.ledgerStore.loadLedgerById(id, { includes: ['category'] });
    }
  }

  protected async deleteLedger(): Promise<void> {
    const id = this.ledgerStore.selectedItem()?.id;
    if (!id || !this.confirmed()) return;

    const deleted = await this.ledgerStore.deleteLedger(id);
    if (deleted) {
      await this.burlNavigation.navigateBack();
    }
  }
}
