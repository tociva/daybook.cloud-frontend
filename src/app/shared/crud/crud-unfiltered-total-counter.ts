import type { Signal } from '@angular/core';
import { signal } from '@angular/core';
import type { Lb4ListQuery } from './lb4-query';

export type CrudCountFn = (query?: Lb4ListQuery) => Promise<number>;

export type CrudUnfilteredTotalCounter = Readonly<{
  totalItems: Signal<number | null>;
  refresh(filter: Pick<Lb4ListQuery, 'where'>): Promise<void>;
}>;

export function createCrudUnfilteredTotalCounter(
  loadCount: CrudCountFn,
): CrudUnfilteredTotalCounter {
  const totalItems = signal<number | null>(null);
  let fetchVersion = 0;

  return {
    totalItems,
    async refresh(filter: Pick<Lb4ListQuery, 'where'>): Promise<void> {
      const currentFetchVersion = ++fetchVersion;
      const hasActiveWhere = Object.keys(filter.where ?? {}).length > 0;

      if (!hasActiveWhere) {
        totalItems.set(null);
        return;
      }

      try {
        const count = await loadCount({});
        if (currentFetchVersion !== fetchVersion) return;
        totalItems.set(Math.max(0, count));
      } catch {
        if (currentFetchVersion !== fetchVersion) return;
        totalItems.set(null);
      }
    },
  };
}
