import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  TngCardActionsComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardFooterComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
  TngCheckboxComponent,
} from '@tailng-ui/components';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlDeleteButtonComponent } from '../../../../../../shared/burl-delete-button/burl-delete-button.component';
import { VendorFacade, VendorStore } from '../../../data/vendor';

@Component({
  selector: 'app-delete-vendor',
  standalone: true,
  imports: [
    TngCardActionsComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardFooterComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    TngCheckboxComponent,
    BurlBackButtonComponent,
    BurlDeleteButtonComponent,
  ],
  templateUrl: './delete-vendor.component.html',
  styleUrl: './delete-vendor.component.css',
})
export class DeleteVendorComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(VendorFacade);
  protected readonly vendorStore = inject(VendorStore);
  protected readonly confirmed = signal(false);

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    if (this.vendorStore.selectedItem()?.id === id) return;
    await this.vendorStore.loadVendorById(id);
  }

  protected async deleteVendor(): Promise<void> {
    const id = this.vendorStore.selectedItem()?.id;
    if (!id || !this.confirmed()) return;

    await this.facade.delete(id);
  }
}
