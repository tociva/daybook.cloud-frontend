import { Component, OnInit, inject } from '@angular/core';
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
import { TaxGroupStore } from '../../../data/tax-group';
import { TaxStore } from '../../../data/tax';
import type { Tax } from '../../../data/tax';

@Component({
  selector: 'app-view-tax-group',
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
  templateUrl: './view-tax-group.component.html',
  styleUrl: './view-tax-group.component.css',
})
export class ViewTaxGroupComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly burlNavigation = inject(BurlNavigationService);
  protected readonly taxGroupStore = inject(TaxGroupStore);
  protected readonly taxStore = inject(TaxStore);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    await Promise.all([
      id ? this.taxGroupStore.loadTaxGroupById(id) : Promise.resolve(null),
      this.taxStore.loadTaxes({}),
    ]);
  }

  protected getTaxById(id: string): Tax | undefined {
    return this.taxStore.items().find((t) => t.id === id);
  }

  protected edit(): void {
    const id = this.taxGroupStore.selectedItem()?.id;
    if (id) {
      void this.router.navigate(['/app/trading/tax-group', id, 'edit'], {
        queryParams: { burl: this.burlNavigation.getBackUrl() },
      });
    }
  }
}

