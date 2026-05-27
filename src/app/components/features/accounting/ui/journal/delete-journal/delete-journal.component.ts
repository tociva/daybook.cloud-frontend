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
import { JournalFacade, JournalStore } from '../../../data/journal';

@Component({
  selector: 'app-delete-journal',
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
  templateUrl: './delete-journal.component.html',
  styleUrl: './delete-journal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteJournalComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(JournalFacade);
  protected readonly journalStore = inject(JournalStore);
  protected readonly confirmed = signal(false);

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    this.journalStore.clearError();

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    if (this.journalStore.selectedItem()?.id === id) return;
    await this.journalStore.loadJournalById(id, { includes: ['entries'] });
  }

  protected async deleteJournal(): Promise<void> {
    const id = this.journalStore.selectedItem()?.id;
    if (!id || !this.confirmed()) return;

    await this.facade.delete(id);
  }
}
