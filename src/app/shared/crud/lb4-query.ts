export type Lb4Where = Record<string, unknown>;

export type Lb4ListQuery = Readonly<{
  /** Relation names to embed; serialized to LoopBack `include` on list requests. */
  includes?: readonly string[];
  limit?: number;
  offset?: number;
  order?: readonly string[];
  where?: Lb4Where;
}>;

export type Lb4Count = Readonly<{
  count: number;
}>;

export type Lb4TextFilterOperator = '=' | '!=' | 'like';

export type Lb4ComparisonFilterOperator = '!=' | '<' | '<=' | '=' | '>' | '>=';

export type Lb4SortDirection = 'asc' | 'desc';

export type Lb4SortChange = Readonly<{
  activeColumnId: string | null;
  direction: Lb4SortDirection | null;
}>;

export type Lb4SortState = Readonly<{
  active: string | null;
  direction: Lb4SortDirection | null;
}>;

export const DEFAULT_LB4_PAGE_SIZE = 10;

export function normalizeLb4Filter(
  filter: Lb4ListQuery,
  defaultLimit = DEFAULT_LB4_PAGE_SIZE,
): Lb4ListQuery {
  const includes = filter.includes?.filter((name) => name.length > 0);
  return {
    limit: filter.limit ?? defaultLimit,
    offset: filter.offset ?? 0,
    ...(filter.order?.length ? { order: filter.order } : {}),
    ...(filter.where ? { where: filter.where } : {}),
    ...(includes?.length ? { includes } : {}),
  };
}

/** LoopBack list `filter` JSON uses `include`, not `includes`. */
export function toLb4ListRequestFilterBody(normalized: Lb4ListQuery): Record<string, unknown> {
  const includeNames = normalized.includes?.filter((n) => n.length > 0);
  return {
    limit: normalized.limit,
    offset: normalized.offset,
    ...(normalized.order?.length ? { order: normalized.order } : {}),
    ...(normalized.where !== undefined ? { where: normalized.where } : {}),
    ...(includeNames?.length ? { include: [...includeNames] } : {}),
  };
}

export function isDefaultLb4Filter(
  filter: Lb4ListQuery,
  defaultLimit = DEFAULT_LB4_PAGE_SIZE,
): boolean {
  return (
    (filter.limit ?? defaultLimit) === defaultLimit &&
    (filter.offset ?? 0) === 0 &&
    !filter.order?.length &&
    filter.where === undefined &&
    !filter.includes?.length
  );
}

export function parseLb4FilterParam(
  filterParam: string | null,
  defaultLimit = DEFAULT_LB4_PAGE_SIZE,
): Lb4ListQuery {
  if (!filterParam) {
    return normalizeLb4Filter({}, defaultLimit);
  }

  try {
    const raw = JSON.parse(filterParam) as Lb4ListQuery & { include?: readonly string[] };
    const includes =
      raw.includes && raw.includes.length > 0
        ? raw.includes
        : raw.include && raw.include.length > 0
          ? raw.include
          : undefined;
    return normalizeLb4Filter(
      {
        limit: raw.limit,
        offset: raw.offset,
        order: raw.order,
        where: raw.where,
        ...(includes?.length ? { includes } : {}),
      },
      defaultLimit,
    );
  } catch {
    return normalizeLb4Filter({}, defaultLimit);
  }
}

export function serializeLb4FilterForUrl(
  filter: Lb4ListQuery,
  defaultLimit = DEFAULT_LB4_PAGE_SIZE,
): string | null {
  const normalizedFilter = normalizeLb4Filter(filter, defaultLimit);

  return isDefaultLb4Filter(normalizedFilter, defaultLimit)
    ? null
    : JSON.stringify(normalizedFilter);
}

export function applyLb4SortChange(filter: Lb4ListQuery, sort: Lb4SortChange): Lb4ListQuery {
  return {
    ...filter,
    offset: 0,
    order:
      sort.activeColumnId && sort.direction
        ? [`${sort.activeColumnId} ${sort.direction.toUpperCase()}`]
        : undefined,
  };
}

export function parseLb4SortState(order: readonly string[] | string | undefined): Lb4SortState {
  const sort = Array.isArray(order) ? order[0] : order;
  if (!sort) {
    return { active: null, direction: null };
  }

  const [active, rawDirection] = sort.split(/\s+/);
  const direction = rawDirection?.toLowerCase();

  if (!active || (direction !== 'asc' && direction !== 'desc')) {
    return { active: null, direction: null };
  }

  return { active, direction };
}

export function buildLb4TextFilterValue(value: string, operator: Lb4TextFilterOperator): unknown {
  switch (operator) {
    case '=':
      return { ilike: value };
    case '!=':
      return { nilike: value };
    case 'like':
    default:
      return { ilike: `%${value}%` };
  }
}

export function buildLb4ComparisonFilterValue<T>(
  value: T,
  operator: Lb4ComparisonFilterOperator,
): unknown {
  switch (operator) {
    case '!=':
      return { neq: value };
    case '<':
      return { lt: value };
    case '<=':
      return { lte: value };
    case '>':
      return { gt: value };
    case '>=':
      return { gte: value };
    case '=':
    default:
      return value;
  }
}

export function readLb4TextFilterValue(where: Lb4ListQuery['where'], field: string): string {
  const fieldFilter = where?.[field];

  if (typeof fieldFilter === 'object' && fieldFilter !== null && 'ilike' in fieldFilter) {
    const value = (fieldFilter as { ilike?: unknown }).ilike;

    return typeof value === 'string' ? trimWildcardPattern(value) : '';
  }

  if (typeof fieldFilter === 'object' && fieldFilter !== null && 'like' in fieldFilter) {
    const value = (fieldFilter as { like?: unknown }).like;

    return typeof value === 'string' ? trimWildcardPattern(value) : '';
  }

  if (typeof fieldFilter === 'object' && fieldFilter !== null && 'nilike' in fieldFilter) {
    const value = (fieldFilter as { nilike?: unknown }).nilike;

    return typeof value === 'string' ? trimWildcardPattern(value) : '';
  }

  if (typeof fieldFilter === 'object' && fieldFilter !== null && 'nlike' in fieldFilter) {
    const value = (fieldFilter as { nlike?: unknown }).nlike;

    return typeof value === 'string' ? trimWildcardPattern(value) : '';
  }

  if (typeof fieldFilter === 'object' && fieldFilter !== null && 'neq' in fieldFilter) {
    const value = (fieldFilter as { neq?: unknown }).neq;

    return typeof value === 'string' ? value : '';
  }

  if (typeof fieldFilter === 'string') {
    return fieldFilter;
  }

  const orFilters = where?.['or'];

  if (!Array.isArray(orFilters)) {
    return '';
  }

  for (const filter of orFilters) {
    const value = readLb4TextFilterValue(filter as Lb4ListQuery['where'], field);

    if (value) {
      return trimWildcardPattern(value);
    }
  }

  return '';
}

export function readLb4TextFilterOperator(
  where: Lb4ListQuery['where'],
  field: string,
): Lb4TextFilterOperator {
  const fieldFilter = where?.[field];

  if (typeof fieldFilter === 'string') {
    return '=';
  }

  if (typeof fieldFilter === 'object' && fieldFilter !== null) {
    if ('nilike' in fieldFilter || 'nlike' in fieldFilter || 'neq' in fieldFilter) {
      return '!=';
    }

    if ('ilike' in fieldFilter || 'like' in fieldFilter) {
      const value =
        (fieldFilter as { ilike?: unknown; like?: unknown }).ilike ??
        (fieldFilter as { ilike?: unknown; like?: unknown }).like;

      return typeof value === 'string' && !value.includes('%') ? '=' : 'like';
    }
  }

  return 'like';
}

function trimWildcardPattern(value: string): string {
  return value.replace(/^%|%$/g, '');
}
