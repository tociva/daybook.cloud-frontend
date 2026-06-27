import type { PermissionMatch } from '../../core/permissions/permissions.model';
import {
  ACCOUNTING_REPORTS_MATCH,
  PERMISSION,
} from '../../core/permissions/permission-requirements';

export type WorkspaceNavItem = Readonly<{
  description: string;
  label: string;
  path: string;
  shortcut: string;
}>;

export type MenuNode = Readonly<{
  path: string;
  name: string;
  permission?: PermissionMatch;
  /** Default child path to navigate to when this group is used as a breadcrumb link. Falls back to the first child. */
  defaultPath?: string;
  children?: readonly MenuNode[];
}>;

export type BreadcrumbItem = Readonly<{
  label: string;
  routerLink?: string;
  current?: boolean;
}>;

export const workspaceSidebarMenu: readonly MenuNode[] = [
  {
    path: 'trading',
    name: 'Trading',
    defaultPath: 'sale-invoice',
    children: [
      { path: 'bank-cash', name: 'Bank & Cash', permission: PERMISSION.branch.bankCash.view },
      { path: 'tax', name: 'Tax', permission: PERMISSION.branch.tax.view },
      { path: 'item', name: 'Item', permission: PERMISSION.branch.item.view },
      { path: 'customer', name: 'Customer', permission: PERMISSION.branch.customer.view },
      { path: 'sale-invoice', name: 'Sale Invoice', permission: PERMISSION.branch.saleInvoice.view },
      { path: 'customer-receipt', name: 'Receipts', permission: PERMISSION.branch.customerReceipt.view },
      { path: 'vendor', name: 'Vendor', permission: PERMISSION.branch.vendor.view },
      { path: 'purchase-invoice', name: 'Purchase Invoice', permission: PERMISSION.branch.purchaseInvoice.view },
      { path: 'vendor-payment', name: 'Payments', permission: PERMISSION.branch.vendorPayment.view },
      { path: 'gst-reconciliation', name: 'GST Reconciliation', permission: PERMISSION.fiscalYear.gstReconciliation.view },
      { path: 'purchase-return', name: 'Purchase Return', permission: PERMISSION.branch.purchaseReturn.view },
    ],
  },
  {
    path: 'accounting',
    name: 'Accounting',
    children: [
      { path: 'ledger', name: 'Ledger', permission: PERMISSION.fiscalYear.ledger.view },
      { path: 'journal', name: 'Journal', permission: PERMISSION.fiscalYear.journal.view },
      { path: 'documents', name: 'Documents', permission: PERMISSION.ownerOnly },
      { path: 'banking', name: 'Banking', permission: PERMISSION.fiscalYear.bankTxn.view },
      { path: 'inventory-ledger-map', name: 'Ledger Mapping', permission: PERMISSION.fiscalYear.inventoryLedgerMap.view },
      { path: 'reports', name: 'Reports', permission: ACCOUNTING_REPORTS_MATCH },
    ],
  },
  {
    path: 'management',
    name: 'Management',
    children: [
      { path: 'organization', name: 'Organization', permission: PERMISSION.root.organization.view },
      { path: 'branch', name: 'Branch', permission: PERMISSION.organization.branch.view },
      { path: 'fiscal-year', name: 'Fiscal Year', permission: PERMISSION.branch.fiscalYear.view },
      { path: 'subscription', name: 'Subscription', permission: PERMISSION.root.userSubscription.view },
      { path: 'users', name: 'Users', permission: PERMISSION.organization.user.view },
    ],
  },
];

export function filterWorkspaceSidebarMenu(
  can: (permission: PermissionMatch) => boolean,
  menu: readonly MenuNode[] = workspaceSidebarMenu,
): readonly MenuNode[] {
  return menu
    .map((node) => {
      const children = node.children?.filter((child) => !child.permission || can(child.permission));
      return children ? { ...node, defaultPath: children[0]?.path, children } : node;
    })
    .filter((node) => {
      if (node.children) return node.children.length > 0;
      return !node.permission || can(node.permission);
    });
}
