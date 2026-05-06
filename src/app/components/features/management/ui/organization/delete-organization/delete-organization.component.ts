import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
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
import { OrganizationStore } from '../../../data/organization';

@Component({
  selector: 'app-delete-organization',
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
  templateUrl: './delete-organization.component.html',
  styleUrl: './delete-organization.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteOrganizationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly burlNavigation = inject(BurlNavigationService);
  protected readonly organizationStore = inject(OrganizationStore);
  protected readonly confirmed = signal(false);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.organizationStore.loadOrganizationById(id);
    }
  }

  protected async deleteOrganization(): Promise<void> {
    const id = this.organizationStore.selectedItem()?.id;
    if (!id || !this.confirmed()) return;

    const deleted = await this.organizationStore.deleteOrganization(id);
    if (deleted) {
      await this.burlNavigation.navigateBack();
    }
  }
}
