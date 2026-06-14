import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { TngButtonComponent } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { getApiErrorMessage } from '../../../../../../core/api/api-error.util';
import { ToastStore } from '../../../../../../core/toast/toast.store';
import { UserSessionStore } from '../../../data/user-session/user-session.store';
import {
  BranchSaleInvoiceTemplateService,
  type Branch,
  type SaleInvoiceTemplateMetadata,
  type SaleInvoiceTemplateType,
} from '../../../data/branch';

type TemplateDefinition = Readonly<{
  type: SaleInvoiceTemplateType;
  title: string;
  description: string;
}>;

const TEMPLATE_DEFINITIONS: readonly TemplateDefinition[] = [
  {
    type: 'no-tax',
    title: 'No tax',
    description: 'Invoices without tax breakup.',
  },
  {
    type: 'one-tax',
    title: 'One tax',
    description: 'Invoices with a single tax component.',
  },
  {
    type: 'two-tax',
    title: 'Two tax',
    description: 'Invoices with two tax components.',
  },
];

const ALLOWED_MIME_TYPES = ['text/html', 'application/xhtml+xml', ''] as const;

@Component({
  selector: 'app-branch-sale-invoice-templates',
  standalone: true,
  imports: [TngButtonComponent, TngIcon],
  templateUrl: './branch-sale-invoice-templates.component.html',
  styleUrl: './branch-sale-invoice-templates.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchSaleInvoiceTemplatesComponent {
  private readonly templateService = inject(BranchSaleInvoiceTemplateService);
  private readonly toastStore = inject(ToastStore);
  private readonly userSessionStore = inject(UserSessionStore);

  readonly branch = input<Branch | null>(null);

  protected readonly templateDefinitions = TEMPLATE_DEFINITIONS;
  protected readonly accept = 'text/html,.html,.htm';
  protected readonly templates = signal<readonly SaleInvoiceTemplateMetadata[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly previewHtml = signal('');
  protected readonly previewType = signal<SaleInvoiceTemplateType | null>(null);
  protected readonly previewLoadingType = signal<SaleInvoiceTemplateType | null>(null);
  protected readonly uploadProgress = signal<Partial<Record<SaleInvoiceTemplateType, number>>>({});
  protected readonly uploadingType = signal<SaleInvoiceTemplateType | null>(null);

  private loadToken = 0;

  constructor() {
    effect(() => {
      const branch = this.branch();
      if (!branch?.id) {
        this.templates.set([]);
        this.previewHtml.set('');
        this.previewType.set(null);
        return;
      }

      void this.loadTemplates(branch);
    });
  }

  protected inputId(type: SaleInvoiceTemplateType): string {
    return `sale-invoice-template-${type}`;
  }

  protected metadataFor(type: SaleInvoiceTemplateType): SaleInvoiceTemplateMetadata | null {
    return this.templates().find((template) => template.templateType === type) ?? null;
  }

  protected progressFor(type: SaleInvoiceTemplateType): number {
    return this.uploadProgress()[type] ?? 0;
  }

  protected chooseFile(type: SaleInvoiceTemplateType): void {
    if (this.uploadingType()) return;
    document.getElementById(this.inputId(type))?.click();
  }

  protected async onFileSelected(type: SaleInvoiceTemplateType, event: Event): Promise<void> {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0] ?? null;
    inputEl.value = '';
    if (!file) return;

    const validationError = this.validateFile(file);
    if (validationError) {
      this.toastStore.warning(validationError);
      return;
    }

    const branch = this.branch();
    if (!branch?.id) {
      this.toastStore.warning('Save the branch before uploading invoice templates.');
      return;
    }

    this.uploadingType.set(type);
    this.patchProgress(type, 0);
    this.error.set(null);

    try {
      await this.ensureTemplateSession(branch);
      await this.templateService.uploadTemplate(type, file, (progress) =>
        this.patchProgress(type, progress),
      );
      await this.loadTemplates(branch);
      if (this.previewType() === type) {
        await this.loadPreview(type);
      }
      this.toastStore.success('Sale invoice template uploaded.');
    } catch (error) {
      const message = getApiErrorMessage(error, 'Failed to upload sale invoice template.');
      this.error.set(message);
      this.toastStore.danger(message);
    } finally {
      this.uploadingType.set(null);
      this.patchProgress(type, 0);
    }
  }

  protected async loadPreview(type: SaleInvoiceTemplateType): Promise<void> {
    const branch = this.branch();
    if (!branch?.id || this.previewLoadingType()) return;

    this.previewLoadingType.set(type);
    this.error.set(null);

    try {
      await this.ensureTemplateSession(branch);
      const html = await this.templateService.getEffectiveTemplateHtml(type);
      this.previewType.set(type);
      this.previewHtml.set(html);
    } catch (error) {
      const message = getApiErrorMessage(error, 'Failed to load sale invoice template HTML.');
      this.error.set(message);
      this.toastStore.danger(message);
    } finally {
      this.previewLoadingType.set(null);
    }
  }

  protected closePreview(): void {
    this.previewType.set(null);
    this.previewHtml.set('');
  }

  protected sourceLabel(metadata: SaleInvoiceTemplateMetadata | null): string {
    return metadata?.source === 'storedDocument' ? 'Custom' : 'Default';
  }

  protected templateName(metadata: SaleInvoiceTemplateMetadata | null): string {
    return metadata?.document?.name ?? 'Backend default template';
  }

  protected templateSize(metadata: SaleInvoiceTemplateMetadata | null): string {
    const size = metadata?.document?.size;
    if (!size) return '';
    return this.formatFileSize(size);
  }

  protected previewTitle(): string {
    const type = this.previewType();
    return this.templateDefinitions.find((definition) => definition.type === type)?.title ?? '';
  }

  private async loadTemplates(branch: Branch): Promise<void> {
    const token = ++this.loadToken;
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.ensureTemplateSession(branch);
      const templates = await this.templateService.listTemplates();
      if (token === this.loadToken) {
        this.templates.set(templates);
      }
    } catch (error) {
      if (token === this.loadToken) {
        this.error.set(getApiErrorMessage(error, 'Failed to load sale invoice templates.'));
      }
    } finally {
      if (token === this.loadToken) {
        this.isLoading.set(false);
      }
    }
  }

  private async ensureTemplateSession(branch: Branch): Promise<void> {
    if (!branch.id) {
      throw new Error('Save the branch before managing invoice templates.');
    }
    if (!branch.organizationid) {
      throw new Error('Branch organization is required to manage invoice templates.');
    }

    const session = this.userSessionStore.session();
    if (!this.sameId(session?.organization?.id, branch.organizationid)) {
      await this.userSessionStore.selectOrganization(branch.organizationid);
    }

    const nextSession = this.userSessionStore.session();
    if (!this.sameId(nextSession?.branch?.id, branch.id)) {
      await this.userSessionStore.selectBranch(branch.id);
    }
  }

  private validateFile(file: File): string | null {
    if (file.size <= 0) return 'Select a non-empty HTML template file.';
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'html' && extension !== 'htm') {
      return 'Sale invoice templates must be HTML files.';
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
      return 'Sale invoice templates must use an HTML file type.';
    }
    return null;
  }

  private patchProgress(type: SaleInvoiceTemplateType, progress: number): void {
    this.uploadProgress.update((state) => ({ ...state, [type]: progress }));
  }

  private formatFileSize(bytes: number): string {
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

  private sameId(left: string | number | undefined | null, right: string | number): boolean {
    return left !== undefined && left !== null && String(left) === String(right);
  }
}
