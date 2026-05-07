import { Component, inject, signal } from '@angular/core';
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
import { TaxGroupFacade, TaxGroupStore } from '../../../data/tax-group';

@Component({
  selector: 'app-delete-tax-group',
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
  templateUrl: './delete-tax-group.component.html',
  styleUrl: './delete-tax-group.component.css',
})
export class DeleteTaxGroupComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(TaxGroupFacade);
  protected readonly taxGroupStore = inject(TaxGroupStore);
  protected readonly confirmed = signal(false);

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.taxGroupStore.loadTaxGroupById(id);
    }
  }

  protected async deleteTaxGroup(): Promise<void> {
    const id = this.taxGroupStore.selectedItem()?.id;
    if (!id || !this.confirmed()) {
      return;
    }

    await this.facade.delete(id);
  }
}
