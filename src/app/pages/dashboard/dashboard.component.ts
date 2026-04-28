import { Component, computed, inject } from '@angular/core';
import {
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
} from '@tailng-ui/components';
import { UserSessionStore } from '../../core/user-session/user-session.store';

@Component({
  selector: 'app-dashboard',
  imports: [
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private readonly userSessionStore = inject(UserSessionStore);
  protected readonly organizationCount = computed(
    () => this.userSessionStore.session()?.ownorgs?.length ?? 0,
  );
}
