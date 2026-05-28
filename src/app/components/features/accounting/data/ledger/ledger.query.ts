import {
  DEFAULT_LB4_PAGE_SIZE,
  normalizeLb4Filter,
  type Lb4ListQuery,
  type Lb4Where,
} from '../../../../../shared/crud';
import type { Ledger, LedgerListQuery } from './ledger.model';

export type LedgerQueryResult = Readonly<{
  count: number;
  items: readonly Ledger[];
}>;

export function applyLedgerListQuery(
  catalog: readonly Ledger[],
  query: LedgerListQuery = {},
  defaultLimit = DEFAULT_LB4_PAGE_SIZE,
): LedgerQueryResult {
  const normalized = normalizeLb4Filter(query, defaultLimit);
  let rows = filterLedgersByWhere(catalog, normalized.where);
  rows = sortLedgers(rows, normalized.order);
  const count = rows.length;
  const offset = normalized.offset ?? 0;
  const limit = normalized.limit ?? defaultLimit;
  const items = rows.slice(offset, offset + limit);
  return { items, count };
}

function filterLedgersByWhere(catalog: readonly Ledger[], where: Lb4Where | undefined): Ledger[] {
  if (!where || Object.keys(where).length === 0) {
    return [...catalog];
  }

  if (Array.isArray(where['and'])) {
    return where['and'].reduce<Ledger[]>(
      (rows, clause) => filterLedgersByWhere(rows, clause as Lb4Where),
      [...catalog],
    );
  }

  if (Array.isArray(where['or'])) {
    const seen = new Set<string>();
    const matched: Ledger[] = [];
    for (const clause of where['or']) {
      for (const ledger of filterLedgersByWhere(catalog, clause as Lb4Where)) {
        const key = ledger.id ?? JSON.stringify(ledger);
        if (!seen.has(key)) {
          seen.add(key);
          matched.push(ledger);
        }
      }
    }
    return matched;
  }

  return catalog.filter((ledger) => matchesWhereClause(ledger, where));
}

function matchesWhereClause(ledger: Ledger, where: Lb4Where): boolean {
  for (const [field, condition] of Object.entries(where)) {
    if (field === 'and' || field === 'or') continue;

    if (field === 'id') {
      if (!matchesIdFilter(ledger.id, condition)) return false;
      continue;
    }

    const value = readFieldValue(ledger, field);
    if (!matchesFieldCondition(value, condition)) return false;
  }

  return true;
}

function matchesIdFilter(id: string | undefined, condition: unknown): boolean {
  if (typeof condition !== 'object' || condition === null) {
    return id === condition;
  }

  if ('inq' in condition && Array.isArray((condition as { inq?: unknown }).inq)) {
    const ids = (condition as { inq: readonly unknown[] }).inq;
    return typeof id === 'string' && ids.some((entry) => entry === id);
  }

  if ('eq' in condition) {
    return id === (condition as { eq: unknown }).eq;
  }

  return true;
}

function readFieldValue(ledger: Ledger, field: string): string {
  switch (field) {
    case 'name':
      return ledger.name ?? '';
    case 'description':
      return ledger.description ?? '';
    case 'category':
      return ledger.category?.name ?? '';
    default:
      return String((ledger as Record<string, unknown>)[field] ?? '');
  }
}

function matchesFieldCondition(value: string, condition: unknown): boolean {
  if (typeof condition === 'string') {
    return value.toLowerCase() === condition.toLowerCase();
  }

  if (typeof condition !== 'object' || condition === null) {
    return true;
  }

  if ('ilike' in condition) {
    const pattern = (condition as { ilike?: unknown }).ilike;
    return typeof pattern === 'string' ? matchesIlike(value, pattern) : true;
  }

  if ('like' in condition) {
    const pattern = (condition as { like?: unknown }).like;
    return typeof pattern === 'string' ? matchesIlike(value, pattern) : true;
  }

  if ('nilike' in condition) {
    const pattern = (condition as { nilike?: unknown }).nilike;
    return typeof pattern === 'string' ? !matchesIlike(value, pattern) : true;
  }

  if ('neq' in condition) {
    const expected = (condition as { neq: unknown }).neq;
    return value.toLowerCase() !== String(expected).toLowerCase();
  }

  return true;
}

function matchesIlike(haystack: string, pattern: string): boolean {
  const needle = pattern.replace(/^%|%$/g, '').toLowerCase();
  if (!needle) return true;
  return haystack.toLowerCase().includes(needle);
}

function sortLedgers(rows: Ledger[], order: readonly string[] | undefined): Ledger[] {
  const sort = order?.[0];
  if (!sort) return rows;

  const [field, rawDirection] = sort.split(/\s+/);
  const direction = rawDirection?.toUpperCase() === 'DESC' ? -1 : 1;

  return [...rows].sort((left, right) => {
    const a = readSortValue(left, field);
    const b = readSortValue(right, field);
    if (typeof a === 'number' && typeof b === 'number') {
      return (a - b) * direction;
    }
    return String(a).localeCompare(String(b), undefined, { sensitivity: 'base' }) * direction;
  });
}

function readSortValue(ledger: Ledger, field: string): string | number {
  switch (field) {
    case 'openingdr':
      return ledger.openingdr ?? 0;
    case 'openingcr':
      return ledger.openingcr ?? 0;
    case 'category':
      return ledger.category?.name ?? '';
    default:
      return readFieldValue(ledger, field);
  }
}
