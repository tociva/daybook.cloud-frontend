import { Component, input, output } from '@angular/core';
import type { GstReconciliationReturnType } from '../../../data/gst-reconciliation/gst-reconciliation.store';
import { GSTR2B_RETURN_TYPE_META } from '../gst-reconciliation.types';
import { GstReconciliationReturnBase } from '../shared/return-base/gst-reconciliation-return-base';
import { GstReconciliationReturnPanelComponent } from '../shared/return-panel/gst-reconciliation-return-panel.component';

@Component({
  selector: 'app-gstr2b-reconciliation',
  standalone: true,
  imports: [GstReconciliationReturnPanelComponent],
  templateUrl: './gstr2b-reconciliation.component.html',
})
export class Gstr2bReconciliationComponent extends GstReconciliationReturnBase {
  readonly canImport = input(false);
  readonly contextAvailable = input(false);
  readonly isParsing = input(false);
  readonly importRequested = output<GstReconciliationReturnType>();

  protected readonly meta = GSTR2B_RETURN_TYPE_META;

  constructor() {
    super('gstr2b');
  }

  protected requestImport(returnType: GstReconciliationReturnType): void {
    this.importRequested.emit(returnType);
  }
}
