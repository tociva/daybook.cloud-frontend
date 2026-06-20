import type { ParamMap, Params } from '@angular/router';
import type { Lb4SortChange, Lb4SortDirection, Lb4SortState } from '../../../../../shared/crud';
import {
  JOURNAL_LINK_WORK_ITEM_DEFAULT_LIMIT,
  JOURNAL_LINK_WORK_ITEM_MAX_LIMIT,
  JOURNAL_LINK_WORK_ITEM_ORDER_FIELDS,
  JOURNAL_LINK_WORK_ITEM_SOURCE_TYPES,
  JOURNAL_LINK_WORK_ITEM_STATUSES,
} from './journal-link-work-item.model';
import type {
  JournalLinkWorkItemOrderField,
  JournalLinkWorkItemQuery,
  JournalLinkWorkItemSourceType,
  JournalLinkWorkItemStatus,
} from './journal-link-work-item.model';

export function isJournalLinkWorkItemSourceType(
  value: string | null | undefined,
): value is JournalLinkWorkItemSourceType {
  return JOURNAL_LINK_WORK_ITEM_SOURCE_TYPES.includes(value as JournalLinkWorkItemSourceType);
}

export function isJournalLinkWorkItemStatus(
  value: string | null | undefined,
): value is JournalLinkWorkItemStatus {
  return JOURNAL_LINK_WORK_ITEM_STATUSES.includes(value as JournalLinkWorkItemStatus);
}

export function isJournalLinkWorkItemOrderField(
  value: string | null | undefined,
): value is JournalLinkWorkItemOrderField {
  return JOURNAL_LINK_WORK_ITEM_ORDER_FIELDS.includes(value as JournalLinkWorkItemOrderField);
}

export function isJournalLinkWorkItemMode(
  params: ParamMap,
  sourceType: JournalLinkWorkItemSourceType,
): boolean {
  return params.get('sourceType') === sourceType;
}

export function parseJournalLinkWorkItemQuery(
  params: ParamMap,
  fallbackSourceType?: JournalLinkWorkItemSourceType,
): JournalLinkWorkItemQuery {
  const sourceType = parseSourceType(params.get('sourceType')) ?? fallbackSourceType;
  const status = parseStatus(params.get('status')) ?? 'not_fully_linked';
  const fromDate = parseDateParam(params.get('fromDate'));
  const toDate = parseDateParam(params.get('toDate'));
  const limit = clampLimit(parseIntegerParam(params.get('limit')));
  const skip = Math.max(0, parseIntegerParam(params.get('skip')) ?? 0);
  const order = normalizeJournalLinkWorkItemOrder(params.get('order'));

  return {
    ...(sourceType ? { sourceType } : {}),
    status,
    ...(fromDate ? { fromDate } : {}),
    ...(toDate ? { toDate } : {}),
    limit,
    skip,
    ...(order ? { order } : {}),
  };
}

export function journalLinkWorkItemQueryToParams(query: JournalLinkWorkItemQuery): Params {
  return {
    sourceType: query.sourceType ?? null,
    status: query.status ?? null,
    fromDate: query.fromDate ?? null,
    toDate: query.toDate ?? null,
    limit: query.limit ?? null,
    skip: query.skip ?? null,
    order: query.order ?? null,
  };
}

export function journalLinkWorkItemSortState(order: string | undefined): Lb4SortState {
  const normalizedOrder = normalizeJournalLinkWorkItemOrder(order);
  if (!normalizedOrder) {
    return { active: null, direction: null };
  }

  const [active, direction] = normalizedOrder.split(/\s+/);
  return {
    active,
    direction: direction.toLowerCase() as Lb4SortDirection,
  };
}

export function applyJournalLinkWorkItemSortChange(
  query: JournalLinkWorkItemQuery,
  sort: Lb4SortChange,
): JournalLinkWorkItemQuery {
  const active = sort.activeColumnId;
  const direction = sort.direction?.toUpperCase();
  const order =
    active && isJournalLinkWorkItemOrderField(active) && (direction === 'ASC' || direction === 'DESC')
      ? `${active} ${direction}`
      : undefined;

  return {
    ...query,
    order,
    skip: 0,
  };
}

export function normalizeJournalLinkWorkItemQuery(
  query: JournalLinkWorkItemQuery,
): JournalLinkWorkItemQuery {
  const sourceType = parseSourceType(query.sourceType);
  const status = parseStatus(query.status) ?? 'not_fully_linked';
  const fromDate = parseDateParam(query.fromDate);
  const toDate = parseDateParam(query.toDate);
  const limit = clampLimit(query.limit);
  const skip = Math.max(0, Math.trunc(Number(query.skip ?? 0)));
  const order = normalizeJournalLinkWorkItemOrder(query.order);

  return {
    ...(sourceType ? { sourceType } : {}),
    status,
    ...(fromDate ? { fromDate } : {}),
    ...(toDate ? { toDate } : {}),
    limit,
    skip,
    ...(order ? { order } : {}),
  };
}

export function journalLinkWorkItemSourceLabel(sourceType: JournalLinkWorkItemSourceType): string {
  switch (sourceType) {
    case 'sale_invoice':
      return 'Sale invoice';
    case 'purchase_invoice':
      return 'Purchase invoice';
    case 'receipt':
      return 'Receipt';
    case 'payment':
      return 'Payment';
    case 'bank_txn':
      return 'Bank transaction';
    case 'contra':
      return 'Contra';
  }
}

export function journalLinkWorkItemStatusLabel(status: JournalLinkWorkItemStatus): string {
  switch (status) {
    case 'not_fully_linked':
      return 'not fully linked';
    case 'unlinked':
      return 'unlinked';
    case 'partial':
      return 'partially linked';
    case 'linked':
      return 'linked';
    case 'all':
      return 'all journal link statuses';
  }
}

function parseSourceType(
  value: string | null | undefined,
): JournalLinkWorkItemSourceType | undefined {
  return isJournalLinkWorkItemSourceType(value) ? value : undefined;
}

function parseStatus(value: string | null | undefined): JournalLinkWorkItemStatus | undefined {
  return isJournalLinkWorkItemStatus(value) ? value : undefined;
}

function parseDateParam(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : undefined;
}

function parseIntegerParam(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
}

function clampLimit(value: number | undefined): number {
  if (!value || value < 1) return JOURNAL_LINK_WORK_ITEM_DEFAULT_LIMIT;
  return Math.min(Math.trunc(value), JOURNAL_LINK_WORK_ITEM_MAX_LIMIT);
}

function normalizeJournalLinkWorkItemOrder(value: string | null | undefined): string | undefined {
  const [field, rawDirection] = value?.trim().split(/\s+/) ?? [];
  const direction = rawDirection?.toUpperCase();

  if (!isJournalLinkWorkItemOrderField(field)) return undefined;
  if (direction !== 'ASC' && direction !== 'DESC') return undefined;

  return `${field} ${direction}`;
}
