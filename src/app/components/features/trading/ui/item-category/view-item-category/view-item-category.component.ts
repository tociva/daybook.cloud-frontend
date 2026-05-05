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
import { ItemCategoryStore } from '../../../data/item-category';

@Component({
  selector: 'app-view-item-category',
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
  templateUrl: './view-item-category.component.html',
  styleUrl: './view-item-category.component.css',
})
export class ViewItemCategoryComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly burlNavigation = inject(BurlNavigationService);
  protected readonly itemCategoryStore = inject(ItemCategoryStore);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.itemCategoryStore.loadItemCategoryById(id, { includes: ['parent', 'taxgroup'] });
    }
  }

  protected edit(): void {
    const id = this.itemCategoryStore.selectedItem()?.id;
    if (id) {
      void this.router.navigate(['/app/trading/item-category', id, 'edit'], {
        queryParams: { burl: this.burlNavigation.getBackUrl() },
      });
    }
  }
}
