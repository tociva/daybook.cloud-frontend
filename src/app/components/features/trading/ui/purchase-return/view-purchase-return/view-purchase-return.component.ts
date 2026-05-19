import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlDeleteButtonComponent } from '../../../../../../shared/burl-delete-button/burl-delete-button.component';
import { BurlEditButtonComponent } from '../../../../../../shared/burl-edit-button/burl-edit-button.component';
import {
  PURCHASE_RETURN_DETAIL_INCLUDES,
  PurchaseReturnStore,
} from '../../../data/purchase-return';
import { PurchaseReturnDraftStore } from '../create-purchase-return/purchase-return-draft.store';
import { PrInvoiceRefComponent } from '../create-purchase-return/pr-invoice-ref/pr-invoice-ref.component';
import { PrReturnDetailsComponent } from '../create-purchase-return/pr-return-details/pr-return-details.component';
import { PrLineItemsComponent } from '../create-purchase-return/pr-line-items/pr-line-items.component';

@Component({
  selector: 'app-view-purchase-return',
  standalone: true,
  providers: [PurchaseReturnDraftStore],
  imports: [
    BurlBackButtonComponent,
    BurlDeleteButtonComponent,
    BurlEditButtonComponent,
    PrInvoiceRefComponent,
    PrLineItemsComponent,
    PrReturnDetailsComponent,
  ],
  templateUrl: './view-purchase-return.component.html',
  styleUrl: './view-purchase-return.component.css',
})
export class ViewPurchaseReturnComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly purchaseReturnStore = inject(PurchaseReturnStore);
  protected readonly draft = inject(PurchaseReturnDraftStore);

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    this.purchaseReturnStore.clearError();

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    const cached = this.purchaseReturnStore.selectedItem();
    if (cached?.id === id) this.draft.patchFromReturn(cached);

    const ret = await this.purchaseReturnStore.loadPurchaseReturnById(id, {
      includes: PURCHASE_RETURN_DETAIL_INCLUDES,
    });
    if (ret) this.draft.patchFromReturn(ret);
  }

  protected editReturn(): void {
    const id = this.purchaseReturnStore.selectedItem()?.id;
    if (id) {
      void this.router.navigate(['/app/trading/purchase-return', id, 'edit'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected deleteReturn(): void {
    const id = this.purchaseReturnStore.selectedItem()?.id;
    if (id) {
      void this.router.navigate(['/app/trading/purchase-return', id, 'delete'], {
        queryParams: { burl: this.router.url },
      });
    }
  }
}
