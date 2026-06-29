import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { TngButtonComponent } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { getApiErrorMessage } from '../../core/api/api-error.util';
import { ToastStore } from '../../core/toast/toast.store';
import type { XlsxExportCallback } from './xlsx-export.model';
import { XlsxExportService } from './xlsx-export.service';

@Component({
  selector: 'app-xlsx-export-button',
  standalone: true,
  imports: [TngButtonComponent, TngIcon],
  templateUrl: './xlsx-export-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class XlsxExportButtonComponent {
  readonly exportData = input.required<XlsxExportCallback>();
  readonly label = input('Export');

  protected readonly isExporting = signal(false);

  private readonly exportService = inject(XlsxExportService);
  private readonly toastStore = inject(ToastStore);

  protected async export(): Promise<void> {
    if (this.isExporting()) {
      return;
    }

    this.isExporting.set(true);

    try {
      const document = await this.exportData()();
      if ((document.rowCount ?? document.worksheet.rows.length) <= 0) {
        this.toastStore.neutral('No records to export.');
        return;
      }

      await this.exportService.download(document);
      this.toastStore.success(`Exported ${(document.rowCount ?? document.worksheet.rows.length).toLocaleString()} rows.`);
    } catch (error) {
      this.toastStore.danger(getApiErrorMessage(error, 'Unable to export records.'));
    } finally {
      this.isExporting.set(false);
    }
  }
}
