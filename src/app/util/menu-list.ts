import { MenuNode } from "./menu-node";

export const menuList: MenuNode[] = [
    {
      path: '/dashboard',
      name: 'Dashboard',
      icon: 'dashboard'
    },
    {
        path: 'inventory',
        name: 'Trading',
        icon: 'account_balance_wallet',
        children: [
          { path: 'bank-cash',
            name: 'Bank & Cash',
            icon: 'account_balance'
            },
          { path: 'tax',
            name: 'Tax',
            icon: 'emoji_nature'
            },
          { path: 'item',
            name: 'Item',
            icon: 'shopping_cart'
            },
          { path: 'customer',
            name: 'Customer',
            icon: 'person'
            },
          { path: 'sales-invoice',
            name: 'Sale Invoice',
            icon: 'corporate_fare'
            },
          { path: 'receipts',
            name: 'Receipts',
            icon: 'receipt_long'
            },
          { path: 'vendor',
            name: 'Vendor',
            icon: 'contacts_product'
            },
          { path: 'purchase-invoice',
            name: 'Purchase Invoice',
            icon: 'receipt'
            },
          { path: 'purchase-return',
            name: 'Purchase Return',
            icon: 'assignment_return'
            },
          { path: 'gst/gstr2b',
            name: 'GST Reconciliation',
            icon: 'sync_alt'
            }
        ]
      },
      {
        path: 'accounts',
        name: 'Accounts',
        icon: 'business_center',
        children: [
          { path: 'ledger',
            name: 'Ledger',
            icon: 'table_chart'
            },
          { path: 'journal',
            name: 'Journal',
            icon: 'auto_stories'
            },
          { path: 'documents',
            name: 'Documents',
            icon: 'attachment'
            },
          { path: 'reports/trial-balance',
            name: 'Trial balance',
            icon: 'table_rows'
            },
          { path: 'daybook',
            name: 'Daybook',
            icon: 'view_day'
            },
          { path: 'reports/profit-loss',
            name: 'Profit and loss',
            icon: 'money'
            },
          { path: 'reports/balance-sheet',
            name: 'Balance sheet',
            icon: 'savings'
            }
        ]
      },
      {
        path: 'settings',
        name: 'Settings',
        icon: 'settings',
        children: [
          { path: 'branch',
            name: 'Branch',
            icon: 'device_hub'
            },
          { path: 'fiscal-year',
            name: 'Fiscal Year',
            icon: 'event_repeat'
            },
          { path: 'users',
            name: 'Users',
            icon: 'person_search'
            }
        ]
      }
  ];
  