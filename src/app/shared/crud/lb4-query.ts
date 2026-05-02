export type Lb4Where = Record<string, unknown>;

export type Lb4ListQuery = Readonly<{
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

export const DEFAULT_LB4_PAGE_SIZE = 10;

export function normalizeLb4Filter(
  filter: Lb4ListQuery,
  defaultLimit = DEFAULT_LB4_PAGE_SIZE,
): Lb4ListQuery {
  return {
    limit: filter.limit ?? defaultLimit,
    offset: filter.offset ?? 0,
    ...(filter.order?.length ? { order: filter.order } : {}),
    ...(filter.where ? { where: filter.where } : {}),
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
    filter.where === undefined
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
    return normalizeLb4Filter(JSON.parse(filterParam) as Lb4ListQuery, defaultLimit);
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

export function buildLb4TextFilterValue(value: string, operator: Lb4TextFilterOperator): unknown {
  switch (operator) {
    case '=':
      return { ilike: value };
    case '!=':
      return { neq: value };
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
    if ('neq' in fieldFilter) {
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
