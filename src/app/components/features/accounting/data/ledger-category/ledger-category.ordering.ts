import type { LedgerCategory, LedgerCategoryRootType } from './ledger-category.model';
import { LEDGER_CATEGORY_CAPITAL_CHILD_TYPES } from './ledger-category.model';

export type LedgerCategoryAccountingBucket = LedgerCategoryRootType;

export type LedgerCategoryLookup = ReadonlyMap<string, LedgerCategory>;

export type LedgerAccountingSource = Readonly<{
  category?: LedgerCategory;
  categoryid?: string | null;
  id?: string;
  name?: string;
}>;

export const LEDGER_CATEGORY_ACCOUNTING_ORDER: readonly LedgerCategoryAccountingBucket[] = [
  'Asset',
  'Liability',
  'Capital',
  'Income',
  'Expense',
];

const UNKNOWN_ACCOUNTING_ORDER = LEDGER_CATEGORY_ACCOUNTING_ORDER.length;

const ACCOUNTING_ORDER_BY_BUCKET = new Map<LedgerCategoryAccountingBucket, number>(
  LEDGER_CATEGORY_ACCOUNTING_ORDER.map((type, index) => [type, index] as const),
);

const ACCOUNTING_BUCKET_ENTRIES: readonly (readonly [string, LedgerCategoryAccountingBucket])[] = [
  ['Asset', 'Asset'],
  ['Liability', 'Liability'],
  ['Capital', 'Capital'],
  ['Equity', 'Capital'],
  ['Income', 'Income'],
  ['Expense', 'Expense'],
  ...LEDGER_CATEGORY_CAPITAL_CHILD_TYPES.map((type) => [type, 'Capital'] as const),
];

const ACCOUNTING_BUCKET_BY_TYPE = new Map<string, LedgerCategoryAccountingBucket>(
  ACCOUNTING_BUCKET_ENTRIES,
);

export function buildLedgerCategoryLookup(
  categories: readonly LedgerCategory[],
): LedgerCategoryLookup {
  const lookup = new Map<string, LedgerCategory>();

  for (const category of categories) {
    if (category.id) lookup.set(category.id, category);
  }

  for (const category of categories) {
    addRelatedCategory(category.parent, lookup);
  }

  return lookup;
}

export function getLedgerCategoryAccountingBucket(
  category: LedgerCategory | null | undefined,
  categoriesById?: LedgerCategoryLookup,
): LedgerCategoryAccountingBucket | null {
  return resolveLedgerCategoryAccountingBucket(category, categoriesById, new Set<string>());
}

export function getLedgerCategoryAccountingRank(
  category: LedgerCategory | null | undefined,
  categoriesById?: LedgerCategoryLookup,
): number {
  const bucket = getLedgerCategoryAccountingBucket(category, categoriesById);
  return bucket
    ? (ACCOUNTING_ORDER_BY_BUCKET.get(bucket) ?? UNKNOWN_ACCOUNTING_ORDER)
    : UNKNOWN_ACCOUNTING_ORDER;
}

export function getLedgerAccountingRank(
  ledger: LedgerAccountingSource,
  categoriesById?: LedgerCategoryLookup,
): number {
  const categoryId = ledger.categoryid ?? ledger.category?.id ?? null;
  const category = (categoryId ? categoriesById?.get(categoryId) : null) ?? ledger.category;
  return getLedgerCategoryAccountingRank(category, categoriesById);
}

export function compareLedgerCategoryAccountingRanks(
  left: LedgerCategory,
  right: LedgerCategory,
  categoriesById?: LedgerCategoryLookup,
): number {
  return (
    getLedgerCategoryAccountingRank(left, categoriesById) -
    getLedgerCategoryAccountingRank(right, categoriesById)
  );
}

export function compareLedgerAccountingRanks(
  left: LedgerAccountingSource,
  right: LedgerAccountingSource,
  categoriesById?: LedgerCategoryLookup,
): number {
  return (
    getLedgerAccountingRank(left, categoriesById) - getLedgerAccountingRank(right, categoriesById)
  );
}

export function compareAccountingText(left: unknown, right: unknown): number {
  return String(left ?? '').localeCompare(String(right ?? ''), undefined, {
    sensitivity: 'base',
  });
}

export function compareLedgerCategoriesByAccountingOrder(
  left: LedgerCategory,
  right: LedgerCategory,
  categoriesById?: LedgerCategoryLookup,
): number {
  return (
    compareLedgerCategoryAccountingRanks(left, right, categoriesById) ||
    compareAccountingText(left.name, right.name) ||
    compareAccountingText(left.id, right.id)
  );
}

export function compareLedgerSourcesByAccountingOrder(
  left: LedgerAccountingSource,
  right: LedgerAccountingSource,
  categoriesById?: LedgerCategoryLookup,
): number {
  return (
    compareLedgerAccountingRanks(left, right, categoriesById) ||
    compareAccountingText(left.name, right.name) ||
    compareAccountingText(left.id, right.id)
  );
}

export function sortLedgerCategoriesByAccountingOrder(
  categories: readonly LedgerCategory[],
): LedgerCategory[] {
  const categoriesById = buildLedgerCategoryLookup(categories);
  return [...categories].sort((left, right) =>
    compareLedgerCategoriesByAccountingOrder(left, right, categoriesById),
  );
}

export function sortLedgersByAccountingOrder<TLedger extends LedgerAccountingSource>(
  ledgers: readonly TLedger[],
  categories: readonly LedgerCategory[] = readLedgerCategories(ledgers),
): TLedger[] {
  const categoriesById = buildLedgerCategoryLookup(categories);
  return [...ledgers].sort((left, right) =>
    compareLedgerSourcesByAccountingOrder(left, right, categoriesById),
  );
}

function resolveLedgerCategoryAccountingBucket(
  category: LedgerCategory | null | undefined,
  categoriesById: LedgerCategoryLookup | undefined,
  seenIds: Set<string>,
): LedgerCategoryAccountingBucket | null {
  if (!category) return null;

  if (category.id) {
    if (seenIds.has(category.id)) return null;
    seenIds.add(category.id);
  }

  const ownBucket = category.props?.type
    ? ACCOUNTING_BUCKET_BY_TYPE.get(category.props.type.trim())
    : null;
  if (ownBucket) return ownBucket;

  const parent = getLedgerCategoryParent(category, categoriesById);
  return resolveLedgerCategoryAccountingBucket(parent, categoriesById, seenIds);
}

function getLedgerCategoryParent(
  category: LedgerCategory,
  categoriesById: LedgerCategoryLookup | undefined,
): LedgerCategory | null {
  const parentId = category.parentid ?? category.parent?.id ?? null;
  if (parentId && parentId !== category.id) {
    return categoriesById?.get(parentId) ?? category.parent ?? null;
  }

  if (category.parent && category.parent !== category) {
    return category.parent;
  }

  return null;
}

function addRelatedCategory(
  category: LedgerCategory | null | undefined,
  lookup: Map<string, LedgerCategory>,
): void {
  if (!category?.id || lookup.has(category.id)) return;

  lookup.set(category.id, category);
  addRelatedCategory(category.parent, lookup);
}

function readLedgerCategories(ledgers: readonly LedgerAccountingSource[]): LedgerCategory[] {
  const categories: LedgerCategory[] = [];
  for (const ledger of ledgers) {
    if (ledger.category) categories.push(ledger.category);
  }
  return categories;
}
