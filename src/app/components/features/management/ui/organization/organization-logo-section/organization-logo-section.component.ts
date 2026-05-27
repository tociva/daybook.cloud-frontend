import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { TngButtonComponent } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import {
  TngFileUploadDirective,
  type TngFileUploadRejectedEvent,
  type TngFileUploadSelectedEvent,
} from '@tailng-ui/primitives';
import { getApiErrorMessage } from '../../../../../../core/api/api-error.util';
import {
  OrganizationService,
  type OrganizationLogoDocument,
  type OrganizationLogoVariant,
} from '../../../data/organization';

type LogoSlot = Readonly<{
  title: string;
  description: string;
  maxSize: number;
}>;

type LogoSelection = Readonly<{
  file: File;
  previewUrl: string;
}>;

const LOGO_SLOTS: Record<OrganizationLogoVariant, LogoSlot> = {
  small: {
    title: 'Small logo',
    description: 'Used in compact headers and selectors.',
    maxSize: 262144,
  },
  normal: {
    title: 'Normal logo',
    description: 'Used in document headers and larger brand areas.',
    maxSize: 1048576,
  },
};

const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'] as const;
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'] as const;

@Component({
  selector: 'app-organization-logo-section',
  standalone: true,
  imports: [TngButtonComponent, TngIcon, TngFileUploadDirective],
  templateUrl: './organization-logo-section.component.html',
  styleUrl: './organization-logo-section.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationLogoSectionComponent implements OnDestroy {
  private readonly organizationService = inject(OrganizationService);

  readonly editable = input(true);
  readonly smallDocumentId = input<string | null | undefined>(null);
  readonly normalDocumentId = input<string | null | undefined>(null);

  protected readonly variants: readonly OrganizationLogoVariant[] = ['small', 'normal'];
  protected readonly slots = LOGO_SLOTS;
  protected readonly accept = 'image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp';
  protected readonly documents = signal<
    Partial<Record<OrganizationLogoVariant, OrganizationLogoDocument | null>>
  >({});
  protected readonly documentLoading = signal<Partial<Record<OrganizationLogoVariant, boolean>>>({});
  protected readonly selections = signal<Partial<Record<OrganizationLogoVariant, LogoSelection>>>({});
  protected readonly uploadProgress = signal<Partial<Record<OrganizationLogoVariant, number>>>({});
  protected readonly errors = signal<Partial<Record<OrganizationLogoVariant, string>>>({});
  protected readonly isUploading = signal(false);

  readonly hasPendingUploads = computed(() =>
    this.variants.some((variant) => this.selections()[variant]?.file),
  );
  readonly hasErrors = computed(() =>
    this.variants.some((variant) => Boolean(this.errors()[variant])),
  );

  constructor() {
    effect(() => {
      void this.loadDocument('small', this.smallDocumentId() ?? null);
    });

    effect(() => {
      void this.loadDocument('normal', this.normalDocumentId() ?? null);
    });
  }

  ngOnDestroy(): void {
    this.revokeAllPreviews();
  }

  clearPending(): void {
    for (const variant of this.variants) {
      this.clearSelection(variant);
      this.patchError(variant, null);
      this.patchProgress(variant, 0);
    }
  }

  async uploadPending(organizationId: string): Promise<void> {
    if (!this.hasPendingUploads()) {
      return;
    }

    if (this.hasErrors()) {
      throw new Error('Fix logo upload errors before saving.');
    }

    this.isUploading.set(true);
    let uploadingVariant: OrganizationLogoVariant | null = null;
    try {
      for (const variant of this.variants) {
        const selection = this.selections()[variant];
        if (!selection) continue;

        uploadingVariant = variant;
        const document = await this.organizationService.uploadLogo(
          organizationId,
          variant,
          selection.file,
          (progress) => this.patchProgress(variant, progress),
        );
        this.patchDocument(variant, document);
        this.clearSelection(variant);
      }
    } catch (error) {
      const message = getApiErrorMessage(error, 'Failed to upload organization logo.');
      this.patchError(uploadingVariant ?? 'small', message);
      throw error;
    } finally {
      this.isUploading.set(false);
    }
  }

  protected chooseLogo(variant: OrganizationLogoVariant): void {
    if (!this.editable() || this.isUploading()) return;
    document.getElementById(this.inputId(variant))?.click();
  }

  protected onLogoSelected(variant: OrganizationLogoVariant, event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0] ?? null;
    inputEl.value = '';
    if (!file) return;

    this.receiveLogoFile(variant, file);
  }

  protected onLogoFilesSelected(
    variant: OrganizationLogoVariant,
    event: TngFileUploadSelectedEvent,
  ): void {
    const file = event.files[0];
    if (file) {
      this.receiveLogoFile(variant, file);
    }
  }

  protected onLogoFilesRejected(
    variant: OrganizationLogoVariant,
    event: TngFileUploadRejectedEvent,
  ): void {
    const first = event.rejected[0];
    this.patchError(variant, first?.message ?? 'Use a PNG, JPG, JPEG, or WEBP image.');
    this.clearSelection(variant);
  }

  private receiveLogoFile(variant: OrganizationLogoVariant, file: File): void {
    const error = this.validateFile(variant, file);
    if (error) {
      this.patchError(variant, error);
      this.clearSelection(variant);
      return;
    }

    const current = this.selections()[variant];
    if (current) {
      URL.revokeObjectURL(current.previewUrl);
    }

    this.selections.update((selections) => ({
      ...selections,
      [variant]: {
        file,
        previewUrl: URL.createObjectURL(file),
      },
    }));
    this.patchError(variant, null);
    this.patchProgress(variant, 0);
  }

  protected removeSelection(variant: OrganizationLogoVariant): void {
    if (this.isUploading()) return;
    this.clearSelection(variant);
    this.patchError(variant, null);
    this.patchProgress(variant, 0);
  }

  protected inputId(variant: OrganizationLogoVariant): string {
    return `organization-logo-${variant}`;
  }

  protected documentFor(variant: OrganizationLogoVariant): OrganizationLogoDocument | null {
    return this.documents()[variant] ?? null;
  }

  protected errorFor(variant: OrganizationLogoVariant): string | null {
    return this.errors()[variant] ?? null;
  }

  protected selectionFor(variant: OrganizationLogoVariant): LogoSelection | null {
    return this.selections()[variant] ?? null;
  }

  protected loadingFor(variant: OrganizationLogoVariant): boolean {
    return Boolean(this.documentLoading()[variant]);
  }

  protected progressFor(variant: OrganizationLogoVariant): number {
    return this.uploadProgress()[variant] ?? 0;
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

  private async loadDocument(
    variant: OrganizationLogoVariant,
    documentId: string | null,
  ): Promise<void> {
    this.patchDocumentLoading(variant, Boolean(documentId));
    if (!documentId) {
      this.patchDocument(variant, null);
      return;
    }

    try {
      const document = await this.organizationService.getLogoDocument(documentId);
      this.patchDocument(variant, document);
      this.patchError(variant, null);
    } catch (error) {
      this.patchDocument(variant, null);
      this.patchError(variant, getApiErrorMessage(error, `Failed to load ${variant} logo.`));
    } finally {
      this.patchDocumentLoading(variant, false);
    }
  }

  private validateFile(variant: OrganizationLogoVariant, file: File): string | null {
    if (file.size <= 0) {
      return 'Select a non-empty image file.';
    }

    if (file.size > LOGO_SLOTS[variant].maxSize) {
      return `${LOGO_SLOTS[variant].title} must be ${this.formatFileSize(LOGO_SLOTS[variant].maxSize)} or smaller.`;
    }

    const extension = file.name.split('.').pop()?.trim().toLowerCase() ?? '';
    const mimeType = file.type.trim().toLowerCase();
    const hasAllowedExtension = ALLOWED_EXTENSIONS.includes(
      extension as (typeof ALLOWED_EXTENSIONS)[number],
    );
    const hasAllowedMimeType = ALLOWED_MIME_TYPES.includes(
      mimeType as (typeof ALLOWED_MIME_TYPES)[number],
    );

    if (!hasAllowedExtension && !hasAllowedMimeType) {
      return 'Use a PNG, JPG, JPEG, or WEBP image.';
    }

    return null;
  }

  private clearSelection(variant: OrganizationLogoVariant): void {
    const selection = this.selections()[variant];
    if (selection) {
      URL.revokeObjectURL(selection.previewUrl);
    }

    this.selections.update((selections) => {
      const next = { ...selections };
      delete next[variant];
      return next;
    });
  }

  private revokeAllPreviews(): void {
    for (const selection of Object.values(this.selections())) {
      if (selection) {
        URL.revokeObjectURL(selection.previewUrl);
      }
    }
  }

  private patchDocument(
    variant: OrganizationLogoVariant,
    document: OrganizationLogoDocument | null,
  ): void {
    this.documents.update((documents) => ({ ...documents, [variant]: document }));
  }

  private patchDocumentLoading(variant: OrganizationLogoVariant, loading: boolean): void {
    this.documentLoading.update((state) => ({ ...state, [variant]: loading }));
  }

  private patchError(variant: OrganizationLogoVariant, message: string | null): void {
    this.errors.update((errors) => {
      const next = { ...errors };
      if (message) {
        next[variant] = message;
      } else {
        delete next[variant];
      }
      return next;
    });
  }

  private patchProgress(variant: OrganizationLogoVariant, progress: number): void {
    this.uploadProgress.update((state) => ({ ...state, [variant]: progress }));
  }
}
