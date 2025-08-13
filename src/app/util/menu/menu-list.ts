import { MenuNode } from "./menu-node";

export const menuList: MenuNode[] = [
    {
      path: '/dashboard',
      name: 'Dashboard',
    },
    {
        path: 'trading',
        name: 'Trading',
        children: [
          { path: 'bank-cash',
            name: 'Bank & Cash',
            },
          { path: 'tax',
            name: 'Tax',
            },
          { path: 'item',
            name: 'Item',
            },
          { path: 'customer',
            name: 'Customer',
            },
          { path: 'sales-invoice',
            name: 'Sale Invoice',
            },
          { path: 'receipts',
            name: 'Receipts',
            },
          { path: 'vendor',
            name: 'Vendor',
            },
          { path: 'purchase-invoice',
            name: 'Purchase Invoice',
            },
          { path: 'purchase-return',
            name: 'Purchase Return',
            },
          { path: 'gst/gstr2b',
            name: 'GST Reconciliation',
            }
        ]
      },
      {
        path: 'accounts',
        name: 'Accounts',
        children: [
          { path: 'ledger',
            name: 'Ledger',
            },
          { path: 'journal',
            name: 'Journal',
            },
          { path: 'documents',
            name: 'Documents',
            },
          { path: 'reports/trial-balance',
            name: 'Trial balance',
            },
          { path: 'daybook',
            name: 'Daybook',
            },
          { path: 'reports/profit-loss',
            name: 'Profit and loss',
            },
          { path: 'reports/balance-sheet',
            name: 'Balance sheet',
            }
        ]
      },
      {
        path: 'management',
        name: 'Management',
        children: [
          { path: 'organization',
            name: 'Organization',
            },
          { path: 'branch',
            name: 'Branch',
            },
          { path: 'fiscal-year',
            name: 'Fiscal Year',
            },
          { path: 'users',
            name: 'Users',
            }
        ]
      }
  ];
  