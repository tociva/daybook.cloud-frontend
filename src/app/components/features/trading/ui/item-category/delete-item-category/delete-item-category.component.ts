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
import { BurlNavigationService } from '../../../../../../shared/burl-back-button/burl-navigation.service';
import { ItemCategoryStore } from '../../../data/item-category';

@Component({
  selector: 'app-delete-item-category',
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
  templateUrl: './delete-item-category.component.html',
  styleUrl: './delete-item-category.component.css',
})
export class DeleteItemCategoryComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly burlNavigation = inject(BurlNavigationService);
  protected readonly itemCategoryStore = inject(ItemCategoryStore);
  protected readonly confirmed = signal(false);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.itemCategoryStore.loadItemCategoryById(id, { includes: ['parent'] });
    }
  }

  protected async deleteItemCategory(): Promise<void> {
    const id = this.itemCategoryStore.selectedItem()?.id;
    if (!id || !this.confirmed()) return;

    const deleted = await this.itemCategoryStore.deleteItemCategory(id);
    if (deleted) {
      await this.burlNavigation.navigateBack();
    }
  }
}
