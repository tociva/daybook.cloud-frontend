import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { ActivatedRoute } from '@angular/router';
import {
  TngCardActionsComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardFooterComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
  TngError,
  TngFormFieldComponent,
  TngInputComponent,
  TngLabelComponent,
  TngSelectComponent,
  TngStepperComponent,
  TngButtonComponent,
  TngTextareaComponent,
} from '@tailng-ui/components';
import {
  TngFileUploadDirective,
  type TngFileUploadRejectedEvent,
  type TngFileUploadSelectedEvent,
} from '@tailng-ui/primitives';
import { ToastStore } from '../../../../../../core/toast/toast.store';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlNavigationService } from '../../../../../../shared/burl-back-button/burl-navigation.service';
import { BurlCreateButtonComponent } from '../../../../../../shared/burl-create-button/burl-create-button.component';
import { SignedUrlUploadService } from '../../../../../../shared/file/signed-url-upload.service';
import { UserSessionStore } from '../../../../management/data/user-session/user-session.store';
import {
  DocumentCategory,
  StoredDocumentFacade,
  StoredDocumentStore,
} from '../../../data/stored-document';
import type { StoredDocumentCreatePayload } from '../../../data/stored-document';

type DocumentFormModel = {
  name: string;
  category: string;
  type: string;
  notes: string;
};
type CategoryOption = Readonly<{
  label: string;
  value: DocumentCategory;
}>;

@Component({
  selector: 'app-create-document',
  standalone: true,
  imports: [
    FormField,
    TngCardActionsComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardFooterComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    TngError,
    TngFormFieldComponent,
    TngInputComponent,
    TngLabelComponent,
    TngSelectComponent,
    TngStepperComponent,
    TngButtonComponent,
    TngTextareaComponent,
    TngFileUploadDirective,
    BurlBackButtonComponent,
    BurlCreateButtonComponent,
  ],
  templateUrl: './create-document.component.html',
  styleUrl: './create-document.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateDocumentComponent implements AfterViewInit {
  @ViewChild('nameInputRef', { read: ElementRef }) private nameInputRef!: ElementRef;
  @ViewChild('fileInputRef', { read: ElementRef }) private fileInputRef!: ElementRef<HTMLInputElement>;

  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(StoredDocumentFacade);
  private readonly signedUrlUpload = inject(SignedUrlUploadService);
  private readonly userSessionStore = inject(UserSessionStore);
  private readonly toastStore = inject(ToastStore);
  private readonly burlNavigation = inject(BurlNavigationService);

  protected readonly documentStore = inject(StoredDocumentStore);
  protected readonly id = signal<string | null>(null);
  protected readonly submitted = signal(false);
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly uploadProgress = signal(0);
  protected readonly uploadError = signal<string | null>(null);
  protected readonly isUploading = signal(false);

  protected readonly model = signal<DocumentFormModel>({
    name: '',
    category: DocumentCategory.OTHER_DOCUMENT,
    type: '',
    notes: '',
  });
  protected readonly documentForm = form(this.model);

  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly title = computed(() => (this.mode() === 'edit' ? 'Edit Document' : 'New Document'));

  protected readonly nameError = computed(() =>
    this.submitted() && this.model().name.trim() === '' ? 'Name is required.' : null,
  );
  protected readonly categoryError = computed(() =>
    this.submitted() && this.model().category.trim() === '' ? 'Category is required.' : null,
  );
  protected readonly fileError = computed(() =>
    this.mode() === 'create' && this.submitted() && !this.selectedFile()
      ? 'File is required while creating a document.'
      : null,
  );
  protected readonly canEditNameAndType = computed(
    () => this.mode() === 'edit' || this.selectedFile() !== null,
  );
  protected readonly documentCategoryOptions = computed<CategoryOption[]>(() =>
    (Object.values(DocumentCategory) as DocumentCategory[]).map((value) => ({
      value,
      label: this.formatCategoryLabel(value),
    })),
  );
  protected readonly categoryOptionLabel = (option: CategoryOption): string => option.label;
  protected readonly categoryOptionValue = (option: CategoryOption): string => option.value;
  protected readonly categoryTrackBy = (_index: number, option: CategoryOption): string => option.value;
  protected readonly setupSteps = computed(() => {
    const model = this.model();
    const metadataCompleted = model.name.trim().length > 0 && model.category.trim().length > 0;
    const detailsCompleted = model.type.trim().length > 0 || model.notes.trim().length > 0;
    const fileCompleted = this.mode() === 'edit' || this.selectedFile() !== null;

    return [
      {
        value: 'metadata',
        label: 'Metadata',
        description: 'Name and category',
        completed: metadataCompleted,
      },
      {
        value: 'details',
        label: 'Details',
        description: 'Type and notes',
        completed: detailsCompleted,
      },
      {
        value: 'file',
        label: 'File',
        description: this.mode() === 'edit' ? 'Existing upload retained' : 'Select file to upload',
        completed: fileCompleted,
      },
    ] as const;
  });
  protected readonly activeSetupStep = computed(() => {
    const firstPending = this.setupSteps().find((step) => !step.completed);
    return firstPending?.value ?? 'file';
  });

  constructor() {
    void this.loadInitialState();
  }

  ngAfterViewInit(): void {
    this.nameInputRef?.nativeElement.querySelector('input')?.focus();
  }

  private async loadInitialState(): Promise<void> {
    this.documentStore.clearError();

    const id = this.route.snapshot.paramMap.get('id');
    this.id.set(id);

    if (!id) {
      this.documentStore.clearSelectedItem();
      return;
    }

    const cached = this.documentStore.selectedItem();
    if (cached?.id === id) {
      this.model.set({
        name: cached.name ?? '',
        category: cached.category ?? '',
        type: cached.type ?? '',
        notes: String(cached.props?.['notes'] ?? ''),
      });
      return;
    }

    const item = await this.documentStore.loadDocumentById(id);
    if (item) {
      this.model.set({
        name: item.name ?? '',
        category: item.category ?? '',
        type: item.type ?? '',
        notes: String(item.props?.['notes'] ?? ''),
      });
    }
  }

  protected chooseFile(): void {
    this.fileInputRef?.nativeElement.click();
  }

  protected onFilePicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.setSelectedFile(file);
  }

  protected onFilesSelected(event: TngFileUploadSelectedEvent): void {
    this.setSelectedFile(event.files[0] ?? null);
  }

  protected onFilesRejected(event: TngFileUploadRejectedEvent): void {
    const message = event.rejected[0]?.message ?? 'Some files were rejected.';
    this.toastStore.warning(message);
    if (event.accepted.length) {
      this.setSelectedFile(event.accepted[0] ?? null);
    }
  }

  protected clearFile(): void {
    this.setSelectedFile(null);
    if (this.fileInputRef?.nativeElement) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  protected onCategoryChange(event: unknown): void {
    const value = typeof event === 'string' ? event : '';
    this.model.update((model) => ({ ...model, category: value }));
  }

  protected async submitForm(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.submitted.set(true);
    this.uploadError.set(null);
    if (this.nameError() || this.categoryError() || this.fileError()) return;

    const id = this.id();
    if (id) {
      await this.facade.update(id, { name: this.model().name.trim() });
      return;
    }

    const file = this.selectedFile();
    if (!file) return;

    const session = this.userSessionStore.session();
    const organizationid = session?.organization?.id ?? session?.branch?.organizationid;
    const addedbyid = session?.userid;

    const payload: StoredDocumentCreatePayload = {
      name: this.model().name.trim(),
      size: file.size,
      type: this.model().type.trim() || this.fileExtension(file.name),
      props: {
        category: this.model().category.trim(),
        status: 'INITIATED',
        mimeType: file.type || 'application/octet-stream',
        notes: this.model().notes.trim(),
        ...(organizationid ? { organizationid } : {}),
        ...(addedbyid ? { addedbyid } : {}),
        originalFileName: file.name,
        source: 'accounting-document',
      },
    };

    const created = await this.facade.create(payload, { navigateBack: false });
    if (!created) return;

    if (created.putUrl) {
      this.isUploading.set(true);
      try {
        await this.signedUrlUpload.uploadFileToSignedUrl(created.putUrl, file, (progress) => {
          this.uploadProgress.set(progress.progress);
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to upload file.';
        this.uploadError.set(message);
        this.toastStore.danger(message);
        this.isUploading.set(false);
        return;
      } finally {
        this.isUploading.set(false);
      }
    }

    await this.burlNavigation.navigateBack();
  }

  private fileExtension(name: string): string {
    const extension = name.split('.').pop()?.trim().toLowerCase();
    return extension && extension !== name.toLowerCase() ? extension : '';
  }

  private formatCategoryLabel(value: DocumentCategory): string {
    return value
      .toLowerCase()
      .split('_')
      .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private setSelectedFile(file: File | null): void {
    this.selectedFile.set(file);
    if (!file) {
      this.model.update((model) => ({ ...model, name: '', type: '' }));
      return;
    }

    const extension = this.fileExtension(file.name);
    this.model.update((model) => ({
      ...model,
      name: file.name,
      type: extension,
    }));
  }
}
