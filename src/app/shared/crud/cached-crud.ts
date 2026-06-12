import {
  DEFAULT_LB4_PAGE_SIZE,
  normalizeLb4Filter,
  type Lb4ListQuery,
  type Lb4Where,
} from './lb4-query';

export type CacheableEntity = Readonly<{
  id?: string;
}>;

export type CachedCrudState<TEntity> = Readonly<{
  catalog: readonly TEntity[];
  catalogLoaded: boolean;
  catalogTotalCount: number;
}>;

export type CachedCrudQueryResult<TEntity> = Readonly<{
  count: number;
  items: readonly TEntity[];
}>;

export type CachedCrudQueryOptions<TEntity> = Readonly<{
  defaultLimit?: number;
  readFieldValue?: (entity: TEntity, field: string) => unknown;
  readSortValue?: (entity: TEntity, field: string) => unknown;
}>;

export type CachedCrudLoader = Readonly<{
  clearPendingLoad: () => void;
  ensureLoaded: () => Promise<boolean>;
}>;

export type CachedCrudLoaderOptions<TEntity> = Readonly<{
  canLoadCatalog?: () => boolean;
  clearCatalog?: () => Promise<void>;
  fetchCatalog: () => Promise<readonly TEntity[]>;
  isEnabled: () => boolean;
  isLoaded: () => boolean;
  loadCatalog?: () => Promise<readonly TEntity[] | null>;
  persistCatalog?: (catalog: readonly TEntity[]) => Promise<void>;
  saveCatalog: (catalog: readonly TEntity[]) => void;
}>;

export function createInitialCachedCrudState<TEntity>(): CachedCrudState<TEntity> {
  return {
    catalog: [],
    catalogLoaded: false,
    catalogTotalCount: 0,
  };
}

export function applyCachedCrudListQuery<TEntity>(
  catalog: readonly TEntity[],
  query: Lb4ListQuery = {},
  options: CachedCrudQueryOptions<TEntity> = {},
): CachedCrudQueryResult<TEntity> {
  const defaultLimit = options.defaultLimit ?? DEFAULT_LB4_PAGE_SIZE;
  const normalized = normalizeLb4Filter(query, defaultLimit);
  let rows = filterCachedCrudByWhere(catalog, normalized.where, options);
  rows = sortCachedCrudRows(rows, normalized.order, options);
  const count = rows.length;
  const offset = normalized.offset ?? 0;
  const limit = normalized.limit ?? defaultLimit;
  const items = rows.slice(offset, offset + limit);

  return { count, items };
}

export function createCachedCrudLoader<TEntity>(
  options: CachedCrudLoaderOptions<TEntity>,
): CachedCrudLoader {
  let loadPromise: Promise<void> | null = null;
  let loadGeneration = 0;

  return {
    clearPendingLoad(): void {
      loadGeneration += 1;
      loadPromise = null;
      void options.clearCatalog?.();
    },

    async ensureLoaded(): Promise<boolean> {
      if (!options.isEnabled()) return false;
      if (options.isLoaded()) return true;

      if (!loadPromise) {
        const generation = loadGeneration;
        loadPromise = (async () => {
          if (options.loadCatalog && (options.canLoadCatalog?.() ?? true)) {
            const persistedCatalog = await options.loadCatalog();
            if (persistedCatalog && generation === loadGeneration && options.isEnabled()) {
              options.saveCatalog(persistedCatalog);
              return;
            }
          }

          const catalog = await options.fetchCatalog();
          if (generation !== loadGeneration || !options.isEnabled()) return;
          await options.persistCatalog?.(catalog).catch(() => undefined);
          options.saveCatalog(catalog);
        })();
      }

      const currentLoad = loadPromise;
      try {
        await currentLoad;
        return options.isEnabled() && options.isLoaded();
      } finally {
        if (loadPromise === currentLoad) {
          loadPromise = null;
        }
      }
    },
  };
}

export function findCachedEntityById<TEntity extends CacheableEntity>(
  catalog: readonly TEntity[],
  id: string,
): TEntity | null {
  return catalog.find((entry) => entry.id === id) ?? null;
}

export function upsertCachedEntity<TEntity extends CacheableEntity>(
  catalog: readonly TEntity[],
  entity: TEntity,
): readonly TEntity[] {
  if (!entity.id) return [entity, ...catalog];

  const existingIndex = catalog.findIndex((entry) => entry.id === entity.id);
  if (existingIndex === -1) return [entity, ...catalog];

  return catalog.map((entry, index) =>
    index === existingIndex ? ({ ...entry, ...entity } as TEntity) : entry,
  );
}

export function updateCachedEntityById<TEntity extends CacheableEntity>(
  catalog: readonly TEntity[],
  id: string,
  mergeEntry: (entry: TEntity) => TEntity,
): readonly TEntity[] {
  return catalog.map((entry) => (entry.id === id ? mergeEntry(entry) : entry));
}

export function removeCachedEntityById<TEntity extends CacheableEntity>(
  catalog: readonly TEntity[],
  id: string,
): readonly TEntity[] {
  return catalog.filter((entry) => entry.id !== id);
}

function filterCachedCrudByWhere<TEntity>(
  catalog: readonly TEntity[],
  where: Lb4Where | undefined,
  options: CachedCrudQueryOptions<TEntity>,
): TEntity[] {
  if (!where || Object.keys(where).length === 0) {
    return [...catalog];
  }

  return catalog.filter((entity) => matchesWhereClause(entity, where, options));
}

function matchesWhereClause<TEntity>(
  entity: TEntity,
  where: Lb4Where,
  options: CachedCrudQueryOptions<TEntity>,
): boolean {
  const andClauses = where['and'];
  if (Array.isArray(andClauses)) {
    const andOk = andClauses.every((clause) =>
      isWhereClause(clause) ? matchesWhereClause(entity, clause, options) : true,
    );
    if (!andOk) return false;
  }

  const orClauses = where['or'];
  if (Array.isArray(orClauses) && orClauses.length > 0) {
    const orOk = orClauses.some((clause) =>
      isWhereClause(clause) ? matchesWhereClause(entity, clause, options) : false,
    );
    if (!orOk) return false;
  }

  for (const [field, condition] of Object.entries(where)) {
    if (field === 'and' || field === 'or') continue;

    const value = readCachedCrudFieldValue(entity, field, options);
    if (!matchesCondition(value, condition)) return false;
  }

  return true;
}

function isWhereClause(value: unknown): value is Lb4Where {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readCachedCrudFieldValue<TEntity>(
  entity: TEntity,
  field: string,
  options: CachedCrudQueryOptions<TEntity>,
): unknown {
  return options.readFieldValue
    ? options.readFieldValue(entity, field)
    : (entity as Record<string, unknown>)[field];
}

function matchesCondition(value: unknown, condition: unknown): boolean {
  if (!isWhereClause(condition)) {
    return matchesEquality(value, condition);
  }

  if ('inq' in condition && Array.isArray(condition['inq'])) {
    return condition['inq'].some((entry) => matchesEquality(value, entry));
  }

  if ('nin' in condition && Array.isArray(condition['nin'])) {
    return !condition['nin'].some((entry) => matchesEquality(value, entry));
  }

  if ('eq' in condition && !matchesEquality(value, condition['eq'])) {
    return false;
  }

  if ('neq' in condition && matchesEquality(value, condition['neq'])) {
    return false;
  }

  if ('ilike' in condition && !matchesLike(value, condition['ilike'], false)) {
    return false;
  }

  if ('like' in condition && !matchesLike(value, condition['like'], false)) {
    return false;
  }

  if ('nilike' in condition && matchesLike(value, condition['nilike'], false)) {
    return false;
  }

  if ('nlike' in condition && matchesLike(value, condition['nlike'], false)) {
    return false;
  }

  if (
    'gt' in condition &&
    !matchesComparison(value, condition['gt'], (left, right) => left > right)
  ) {
    return false;
  }

  if (
    'gte' in condition &&
    !matchesComparison(value, condition['gte'], (left, right) => left >= right)
  ) {
    return false;
  }

  if (
    'lt' in condition &&
    !matchesComparison(value, condition['lt'], (left, right) => left < right)
  ) {
    return false;
  }

  if (
    'lte' in condition &&
    !matchesComparison(value, condition['lte'], (left, right) => left <= right)
  ) {
    return false;
  }

  if ('between' in condition && !matchesBetween(value, condition['between'])) {
    return false;
  }

  return true;
}

function matchesEquality(value: unknown, expected: unknown): boolean {
  if (typeof value === 'string' || typeof expected === 'string') {
    return String(value ?? '').toLowerCase() === String(expected ?? '').toLowerCase();
  }

  return value === expected;
}

function matchesLike(value: unknown, pattern: unknown, caseSensitive: boolean): boolean {
  if (typeof pattern !== 'string') return true;

  const haystack = String(value ?? '');
  const needle = pattern.replace(/^%|%$/g, '');
  if (!needle) return true;

  return caseSensitive
    ? haystack.includes(needle)
    : haystack.toLowerCase().includes(needle.toLowerCase());
}

function matchesComparison(
  value: unknown,
  expected: unknown,
  compare: (left: number | string, right: number | string) => boolean,
): boolean {
  const left = normalizeComparableValue(value);
  const right = normalizeComparableValue(expected);

  if (left === null || right === null) return false;

  return compare(left, right);
}

function matchesBetween(value: unknown, range: unknown): boolean {
  if (!Array.isArray(range) || range.length !== 2) return true;

  return (
    matchesComparison(value, range[0], (left, right) => left >= right) &&
    matchesComparison(value, range[1], (left, right) => left <= right)
  );
}

function normalizeComparableValue(value: unknown): number | string | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : value;
  }
  return null;
}

function sortCachedCrudRows<TEntity>(
  rows: TEntity[],
  order: readonly string[] | undefined,
  options: CachedCrudQueryOptions<TEntity>,
): TEntity[] {
  const sort = order?.[0];
  if (!sort) return rows;

  const [field, rawDirection] = sort.split(/\s+/);
  const direction = rawDirection?.toUpperCase() === 'DESC' ? -1 : 1;

  return [...rows].sort((left, right) => {
    const a = readCachedCrudSortValue(left, field, options);
    const b = readCachedCrudSortValue(right, field, options);

    if (typeof a === 'number' && typeof b === 'number') {
      return (a - b) * direction;
    }

    return (
      String(a ?? '').localeCompare(String(b ?? ''), undefined, { sensitivity: 'base' }) * direction
    );
  });
}

function readCachedCrudSortValue<TEntity>(
  entity: TEntity,
  field: string,
  options: CachedCrudQueryOptions<TEntity>,
): unknown {
  return options.readSortValue
    ? options.readSortValue(entity, field)
    : readCachedCrudFieldValue(entity, field, options);
}
