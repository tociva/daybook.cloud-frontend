import type { GstReconciliationStatus } from '../../../data/gst-reconciliation/gst-reconciliation.store';
import type { GstReconciliationMonthCell } from '../gst-reconciliation.types';

export type GstReconciliationStatusMeta = Readonly<{
  icon: string;
  label: string;
  status: GstReconciliationStatus;
}>;

export type GstReconciliationStatusTagTone =
  | 'danger'
  | 'info'
  | 'neutral'
  | 'success'
  | 'warning';

export const GST_RECONCILIATION_STATUS_LEGEND: readonly GstReconciliationStatusMeta[] = [
  { status: 'matched',      label: 'Matched',       icon: 'circleCheck'  },
  { status: 'partialMatch', label: 'Partial match', icon: 'circleAlert'  },
  { status: 'noMatch',      label: 'No match',      icon: 'circleX'      },
  { status: 'inProgress',   label: 'In progress',   icon: 'loaderCircle' },
  { status: 'pending',      label: 'Pending',       icon: 'circleDashed' },
  { status: 'upcoming',     label: 'Upcoming',      icon: 'clock'        },
];

export function gstReconciliationStatusLabel(status: GstReconciliationStatus): string {
  return GST_RECONCILIATION_STATUS_LEGEND.find((entry) => entry.status === status)?.label ?? status;
}

export function gstReconciliationStatusIcon(status: GstReconciliationStatus): string {
  return GST_RECONCILIATION_STATUS_LEGEND.find((entry) => entry.status === status)?.icon ?? 'circle';
}

export function gstReconciliationStatusTone(
  status: GstReconciliationStatus,
): GstReconciliationStatusTagTone {
  switch (status) {
    case 'matched':
      return 'success';
    case 'partialMatch':
      return 'warning';
    case 'noMatch':
      return 'danger';
    case 'inProgress':
      return 'info';
    case 'pending':
    case 'upcoming':
      return 'neutral';
  }
}

export function totalGstReconciliationMonthsByStatus(
  months: readonly GstReconciliationMonthCell[],
  status: GstReconciliationStatus,
): number {
  return months.filter((month) => month.status === status).length;
}
