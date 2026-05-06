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
import { BranchStore } from '../../../data/branch';

@Component({
  selector: 'app-delete-branch',
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
  templateUrl: './delete-branch.component.html',
  styleUrl: './delete-branch.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteBranchComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly burlNavigation = inject(BurlNavigationService);
  protected readonly branchStore = inject(BranchStore);
  protected readonly confirmed = signal(false);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.branchStore.loadBranchById(id, { includes: ['organization'] });
    }
  }

  protected async deleteBranch(): Promise<void> {
    const id = this.branchStore.selectedItem()?.id;
    if (!id || !this.confirmed()) return;

    const deleted = await this.branchStore.deleteBranch(id);
    if (deleted) {
      await this.burlNavigation.navigateBack();
    }
  }
}
