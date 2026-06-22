import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TngButtonComponent } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { BurlBackButtonComponent } from '../../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlNavigationService } from '../../../../../../../shared/burl-back-button/burl-navigation.service';
import { BurlCreateButtonComponent } from '../../../../../../../shared/burl-create-button/burl-create-button.component';
import { JournalFacade, JournalStore } from '../../../../data/journal';
import { JournalCreateDraftStagingService } from '../journal-create-draft-staging.service';
import { JournalCreateFormComponent } from '../journal-create-form/journal-create-form.component';

@Component({
  selector: 'app-journal-create-shell',
  standalone: true,
  imports: [
    BurlBackButtonComponent,
    BurlCreateButtonComponent,
    JournalCreateFormComponent,
    TngButtonComponent,
    TngIcon,
  ],
  templateUrl: './create-shell.component.html',
  styleUrl: './create-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateShellComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly navigation = inject(BurlNavigationService);
  private readonly draftStaging = inject(JournalCreateDraftStagingService);
  private readonly facade = inject(JournalFacade);
  private readonly journalStore = inject(JournalStore);

  protected readonly journalForm = viewChild.required(JournalCreateFormComponent);

  protected readonly id = signal<string | null>(null);

  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly title = computed(() =>
    this.mode() === 'edit' ? 'Edit journal' : 'New journal',
  );
  protected readonly submitLabel = computed(() =>
    this.mode() === 'edit' ? 'Save changes' : 'Create journal',
  );
  protected readonly submitIcon = computed(() => (this.mode() === 'edit' ? 'save' : 'plus'));
  protected readonly isSaving = computed(
    () => this.journalStore.isLoading() || this.journalForm().isBusy(),
  );

  constructor() {
    this.id.set(this.route.snapshot.paramMap.get('id'));
  }

  protected clone(): void {
    if (this.mode() !== 'edit') return;

    const snapshot = this.journalForm().buildCloneSnapshot();
    this.draftStaging.stage(snapshot);
    void this.router.navigate(['/app/accounting/journal/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    const form = this.journalForm();
    const payload = form.buildPayload();
    if (!payload) return;

    const journalId = this.id();
    let savedJournal = null;

    if (journalId) {
      const saved = await this.facade.update(journalId, payload, { navigateBack: false });
      savedJournal = saved ? (this.journalStore.selectedItem() ?? null) : null;
    } else {
      savedJournal = await this.facade.create(payload, { navigateBack: false });
    }

    if (!savedJournal?.id) return;
    if (!(await form.attachPendingDocuments(savedJournal.id, savedJournal))) return;

    form.rememberJournalDate();
    void this.navigation.navigateBack();
  }
}
