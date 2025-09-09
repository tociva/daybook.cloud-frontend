# Accounting Feature

This feature provides accounting functionality for the Daybook application, including ledger management and ledger category management.

## Structure

```
accounting/
├── store/                    # State management
│   ├── ledger/              # Ledger store
│   │   ├── ledger.actions.ts
│   │   ├── ledger.effects.ts
│   │   ├── ledger.model.ts
│   │   ├── ledger.state.ts
│   │   ├── ledger.store.ts
│   │   └── index.ts
│   └── ledger-category/     # Ledger Category store
│       ├── ledger-category.actions.ts
│       ├── ledger-category.effects.ts
│       ├── ledger-category.model.ts
│       ├── ledger-category.state.ts
│       ├── ledger-category.store.ts
│       └── index.ts
├── ui/                      # User interface components
│   ├── ledger/             # Ledger UI components
│   │   ├── list-ledger/
│   │   │   ├── list-ledger.ts
│   │   │   ├── list-ledger.html
│   │   │   └── list-ledger.css
│   │   ├── create-ledger/
│   │   │   ├── create-ledger.ts
│   │   │   ├── create-ledger.html
│   │   │   └── create-ledger.css
│   │   ├── delete-ledger/
│   │   │   ├── delete-ledger.ts
│   │   │   ├── delete-ledger.html
│   │   │   └── delete-ledger.css
│   │   ├── ledger.routes.ts
│   │   └── index.ts
│   └── ledger-category/    # Ledger Category UI components
│       ├── list-ledger-category/
│       │   ├── list-ledger-category.ts
│       │   ├── list-ledger-category.html
│       │   └── list-ledger-category.css
│       ├── create-ledger-category/
│       │   ├── create-ledger-category.ts
│       │   ├── create-ledger-category.html
│       │   └── create-ledger-category.css
│       ├── delete-ledger-category/
│       │   ├── delete-ledger-category.ts
│       │   ├── delete-ledger-category.html
│       │   └── delete-ledger-category.css
│       ├── ledger-category.routes.ts
│       └── index.ts
├── accounting.routes.ts     # Main routing configuration
├── index.ts                 # Main exports
└── README.md               # This file
```

## Components

### Ledger
- **Model**: Represents a ledger account with properties like name, description, opening balances, category, and fiscal year
- **Store**: Manages ledger state using NgRx with actions, effects, and stores (no services)
- **UI**: 
  - List component for displaying and managing ledgers
  - Create/Edit component for creating and editing ledgers with full form validation
  - Delete component for deleting ledgers with confirmation

### Ledger Category
- **Model**: Represents a ledger category with hierarchical structure (parent-child relationships)
- **Store**: Manages ledger category state using NgRx with actions, effects, and stores (no services)
- **UI**: 
  - List component for displaying and managing ledger categories
  - Create/Edit component for creating and editing ledger categories with full form validation
  - Delete component for deleting ledger categories with confirmation

## Features

- CRUD operations for ledgers and ledger categories
- Hierarchical category management
- Integration with fiscal years
- Search and pagination
- Sorting capabilities
- Error handling
- Uses NgRx effects with HTTP actions (no service classes)
- Full form validation
- Auto-complete fields for categories and fiscal years
- Form draft binding for better UX
- "Add New" functionality for categories and fiscal years

## Navigation

The accounting feature is accessible through the main navigation menu under "Accounting" with the following sub-items:
- Ledger
- Ledger Category
- Journal (placeholder)
- Documents (placeholder)
- Reports (placeholder)
- Daybook (placeholder)

## Routes

### Ledger Routes
- `/accounting/ledger` - List all ledgers
- `/accounting/ledger/create` - Create new ledger
- `/accounting/ledger/:id/edit` - Edit existing ledger
- `/accounting/ledger/:id/view` - View ledger details
- `/accounting/ledger/:id/delete` - Delete ledger

### Ledger Category Routes
- `/accounting/ledger-category` - List all ledger categories
- `/accounting/ledger-category/create` - Create new ledger category
- `/accounting/ledger-category/:id/edit` - Edit existing ledger category
- `/accounting/ledger-category/:id/view` - View ledger category details
- `/accounting/ledger-category/:id/delete` - Delete ledger category

## Dependencies

- Angular 17+
- NgRx for state management
- Shared components (ItemLanding, TwoColumnForm, etc.)
- Utility services and types
- HTTP state management for API calls
- Form validation utilities
- Form draft binding system

## Implementation Status

- ✅ **Store Layer**: Complete with actions, effects, models, state, and stores
- ✅ **List Components**: Complete with proper UI and functionality
- ✅ **Create/Edit Components**: Complete with full form validation and auto-complete
- ✅ **Delete Components**: Complete with confirmation dialogs
- ✅ **Routing**: Complete with all CRUD routes
- ✅ **Form Validation**: Complete with proper validation rules
- ✅ **Auto-complete**: Complete for categories and fiscal years
- ✅ **Form Draft Binding**: Complete for better user experience

## Form Fields

### Ledger Form
- **Basic Details**: Name (required), Description
- **Category & Fiscal Year**: Category (required, auto-complete), Fiscal Year (required, auto-complete)
- **Opening Balances**: Opening DR Balance, Opening CR Balance

### Ledger Category Form
- **Basic Details**: Name (required), Description
- **Category & Fiscal Year**: Parent Category (optional, auto-complete), Fiscal Year (required, auto-complete)
- **Category Properties**: Category Type (optional, auto-complete with Asset, Liability, Equity, Income, Expense)
