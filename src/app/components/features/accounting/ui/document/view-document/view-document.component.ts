import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  TngCardActionsComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardFooterComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
} from '@tailng-ui/components';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlNavigationService } from '../../../../../../shared/burl-back-button/burl-navigation.service';
import { BurlDeleteButtonComponent } from '../../../../../../shared/burl-delete-button/burl-delete-button.component';
import { BurlEditButtonComponent } from '../../../../../../shared/burl-edit-button/burl-edit-button.component';
import { StoredDocumentStore } from '../../../data/stored-document';

@Component({
  selector: 'app-view-document',
  standalone: true,
  imports: [
    TngCardActionsComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardFooterComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    BurlBackButtonComponent,
    BurlDeleteButtonComponent,
    BurlEditButtonComponent,
  ],
  templateUrl: './view-document.component.html',
  styleUrl: './view-document.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewDocumentComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly burlNavigation = inject(BurlNavigationService);
  protected readonly documentStore = inject(StoredDocumentStore);

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

  protected edit(): void {
    const id = this.documentStore.selectedItem()?.id;
    if (!id) return;
    void this.router.navigate(['/app/accounting/documents', id, 'edit'], {
      queryParams: { burl: this.burlNavigation.getBackUrl() },
    });
  }

  protected delete(): void {
    const id = this.documentStore.selectedItem()?.id;
    if (!id) return;
    void this.router.navigate(['/app/accounting/documents', id, 'delete'], {
      queryParams: { burl: this.burlNavigation.getBackUrl() },
    });
  }

  protected formatFileSize(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'] as const;
    let value = bytes;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }
    return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
  }
}
