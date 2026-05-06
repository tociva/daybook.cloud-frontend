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
import { CustomerFacade, CustomerStore } from '../../../data/customer';

@Component({
  selector: 'app-delete-customer',
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
  templateUrl: './delete-customer.component.html',
  styleUrl: './delete-customer.component.css',
})
export class DeleteCustomerComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(CustomerFacade);
  protected readonly customerStore = inject(CustomerStore);
  protected readonly confirmed = signal(false);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.customerStore.loadCustomerById(id);
    }
  }

  protected async deleteCustomer(): Promise<void> {
    const id = this.customerStore.selectedItem()?.id;
    if (!id || !this.confirmed()) return;

    await this.facade.delete(id);
  }
}
