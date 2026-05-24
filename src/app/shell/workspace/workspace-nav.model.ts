export type WorkspaceNavItem = Readonly<{
  description: string;
  label: string;
  path: string;
  shortcut: string;
}>;

export type MenuNode = Readonly<{
  path: string;
  name: string;
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
      { path: 'bank-cash', name: 'Bank & Cash' },
      { path: 'tax', name: 'Tax' },
      { path: 'item', name: 'Item' },
      { path: 'customer', name: 'Customer' },
      { path: 'sale-invoice', name: 'Sale Invoice' },
      { path: 'customer-receipt', name: 'Receipts' },
      { path: 'vendor', name: 'Vendor' },
      { path: 'purchase-invoice', name: 'Purchase Invoice' },
      { path: 'vendor-payment', name: 'Payments' },
      { path: 'gst-reconciliation', name: 'GST Reconciliation' },
      { path: 'purchase-return', name: 'Purchase Return' },
    ],
  },
  {
    path: 'accounting',
    name: 'Accounting',
    children: [
      { path: 'ledger', name: 'Ledger' },
      { path: 'journal', name: 'Journal' },
      { path: 'documents', name: 'Documents' },
      { path: 'reports/trial-balance', name: 'Trial balance' },
      { path: 'daybook', name: 'Daybook' },
      { path: 'reports/profit-loss', name: 'Profit and loss' },
      { path: 'reports/balance-sheet', name: 'Balance sheet' },
      { path: 'banking', name: 'Banking' },
    ],
  },
  {
    path: 'management',
    name: 'Management',
    children: [
      { path: 'organization', name: 'Organization' },
      { path: 'branch', name: 'Branch' },
      { path: 'fiscal-year', name: 'Fiscal Year' },
      { path: 'subscription', name: 'Subscription' },
      { path: 'users', name: 'Users' },
    ],
  },
];
