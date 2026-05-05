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
import { ItemStore } from '../../../data/item';

@Component({
  selector: 'app-delete-item',
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
  templateUrl: './delete-item.component.html',
  styleUrl: './delete-item.component.css',
})
export class DeleteItemComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly burlNavigation = inject(BurlNavigationService);
  protected readonly itemStore = inject(ItemStore);
  protected readonly confirmed = signal(false);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.itemStore.loadItemById(id, { includes: ['category'] });
    }
  }

  protected async deleteItem(): Promise<void> {
    const id = this.itemStore.selectedItem()?.id;
    if (!id || !this.confirmed()) return;

    const deleted = await this.itemStore.deleteItem(id);
    if (deleted) {
      await this.burlNavigation.navigateBack();
    }
  }
}
