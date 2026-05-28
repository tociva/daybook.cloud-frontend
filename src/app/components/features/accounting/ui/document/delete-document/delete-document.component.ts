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
import { StoredDocumentFacade, StoredDocumentStore } from '../../../data/stored-document';

@Component({
  selector: 'app-delete-document',
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
  templateUrl: './delete-document.component.html',
  styleUrl: './delete-document.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteDocumentComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(StoredDocumentFacade);
  protected readonly documentStore = inject(StoredDocumentStore);
  protected readonly confirmed = signal(false);

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    this.documentStore.clearError();

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    if (this.documentStore.selectedItem()?.id === id) return;
    await this.documentStore.loadDocumentById(id);
  }

  protected async deleteDocument(): Promise<void> {
    const id = this.documentStore.selectedItem()?.id;
    if (!id || !this.confirmed()) return;
    await this.facade.delete(id);
  }
}
