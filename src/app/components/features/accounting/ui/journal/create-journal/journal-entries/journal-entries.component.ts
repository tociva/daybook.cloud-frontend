import { Component, input, output, inject } from '@angular/core';
import {
  TngAutocompleteComponent,
  TngButtonComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
  TngInputComponent,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { InvoiceDocumentTagsComponent } from '../../../../../trading/ui/shared/invoice-document-tags/invoice-document-tags.component';
import type { StoredDocument } from '../../../../../trading/data/invoice-document';
import { JournalDraftStore } from '../journal-draft.store';

@Component({
  selector: 'app-journal-entries',
  standalone: true,
  imports: [
    TngAutocompleteComponent,
    TngButtonComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    TngInputComponent,
    TngIcon,
    InvoiceDocumentTagsComponent,
  ],
  templateUrl: './journal-entries.component.html',
  styleUrl: './journal-entries.component.css',
})
export class JournalEntriesComponent {
  protected readonly draft = inject(JournalDraftStore);

  readonly documents = input<readonly StoredDocument[]>([]);
  readonly pendingFiles = input<readonly File[]>([]);
  readonly documentsDisabled = input(false);
  readonly documentsUploading = input(false);
  readonly pendingFilesChange = output<readonly File[]>();
  readonly documentRemove = output<StoredDocument>();
}
