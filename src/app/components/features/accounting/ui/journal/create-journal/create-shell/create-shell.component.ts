import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BurlBackButtonComponent } from '../../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlNavigationService } from '../../../../../../../shared/burl-back-button/burl-navigation.service';
import { BurlCreateButtonComponent } from '../../../../../../../shared/burl-create-button/burl-create-button.component';
import type { Journal } from '../../../../data/journal';
import { JournalCreateFormComponent } from '../journal-create-form/journal-create-form.component';

@Component({
  selector: 'app-journal-create-shell',
  standalone: true,
  imports: [BurlBackButtonComponent, BurlCreateButtonComponent, JournalCreateFormComponent],
  templateUrl: './create-shell.component.html',
  styleUrl: './create-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateShellComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly navigation = inject(BurlNavigationService);

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

  constructor() {
    this.id.set(this.route.snapshot.paramMap.get('id'));
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    await this.journalForm().submit();
  }

  protected onSaved(_journal: Journal): void {
    void this.navigation.navigateBack();
  }
}
