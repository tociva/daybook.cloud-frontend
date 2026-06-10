import { Component } from '@angular/core';
import {
  TngButtonComponent,
  TngCardComponent,
  TngTable,
  TngTableCellTpl,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { GstReconciliationMonthlyDetailBase } from '../shared/monthly-detail/gst-reconciliation-monthly-detail-base';
import { GSTR1_MONTHLY_DETAIL_CONFIG } from '../shared/monthly-detail/gst-reconciliation-monthly-detail.config';

@Component({
  selector: 'app-gstr1-reconciliation-monthly-detail',
  standalone: true,
  imports: [
    PageHeadingComponent,
    TngButtonComponent,
    TngCardComponent,
    TngIcon,
    TngTable,
    TngTableCellTpl,
  ],
  templateUrl: '../shared/monthly-detail/gst-reconciliation-monthly-detail.component.html',
  styleUrl: '../shared/monthly-detail/gst-reconciliation-monthly-detail.component.css',
})
export class Gstr1ReconciliationMonthlyDetailComponent extends GstReconciliationMonthlyDetailBase {
  constructor() {
    super(GSTR1_MONTHLY_DETAIL_CONFIG);
  }
}
