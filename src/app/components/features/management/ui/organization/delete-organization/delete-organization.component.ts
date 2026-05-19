import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
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
import { OrganizationFacade, OrganizationStore } from '../../../data/organization';

@Component({
  selector: 'app-delete-organization',
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
  templateUrl: './delete-organization.component.html',
  styleUrl: './delete-organization.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteOrganizationComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(OrganizationFacade);
  protected readonly organizationStore = inject(OrganizationStore);
  protected readonly confirmed = signal(false);

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    this.organizationStore.clearError();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.organizationStore.loadOrganizationById(id);
    }
  }

  protected async deleteOrganization(): Promise<void> {
    const id = this.organizationStore.selectedItem()?.id;
    if (!id || !this.confirmed()) return;

    await this.facade.delete(id);
  }
}
