import { Component, OnInit, inject, signal } from '@angular/core';
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
import { VendorFacade, VendorStore } from '../../../data/vendor';

@Component({
  selector: 'app-delete-vendor',
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
  templateUrl: './delete-vendor.component.html',
  styleUrl: './delete-vendor.component.css',
})
export class DeleteVendorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(VendorFacade);
  protected readonly vendorStore = inject(VendorStore);
  protected readonly confirmed = signal(false);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.vendorStore.loadVendorById(id);
    }
  }

  protected async deleteVendor(): Promise<void> {
    const id = this.vendorStore.selectedItem()?.id;
    if (!id || !this.confirmed()) return;

    await this.facade.delete(id);
  }
}
