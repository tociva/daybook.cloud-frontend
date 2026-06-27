import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TngCardComponent } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { PermissionsStore } from '../../../../../../core/permissions/permissions.store';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { hasAccountingReportPermission } from '../../../shared/accounting-report-permissions';
import {
  accountingReportsNavItems,
  type AccountingReportNavItem,
} from '../shared/accounting-reports-nav.model';

@Component({
  selector: 'app-accounting-reports',
  imports: [PageHeadingComponent, TngCardComponent, TngIcon],
  templateUrl: './accounting-reports.component.html',
  styleUrl: './accounting-reports.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountingReportsComponent {
  private readonly permissionsStore = inject(PermissionsStore);
  private readonly router = inject(Router);

  protected readonly visibleReports = computed(() => {
    return accountingReportsNavItems.filter((report) =>
      hasAccountingReportPermission(this.permissionsStore, report.permissionScope),
    );
  });

  protected openReport(report: AccountingReportNavItem): void {
    if (!hasAccountingReportPermission(this.permissionsStore, report.permissionScope)) return;
    void this.router.navigateByUrl(report.route);
  }
}
