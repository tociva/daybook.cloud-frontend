import { describe, expect, it, vi } from 'vitest';
import { createCrudUnfilteredTotalCounter } from './crud-unfiltered-total-counter';

describe('createCrudUnfilteredTotalCounter', () => {
  it('does not load an unfiltered count when no where filter is active', async () => {
    const loadCount = vi.fn(async () => 301);
    const counter = createCrudUnfilteredTotalCounter(loadCount);

    await counter.refresh({});

    expect(loadCount).not.toHaveBeenCalled();
    expect(counter.totalItems()).toBeNull();
  });

  it('loads the unfiltered count when a where filter is active', async () => {
    const loadCount = vi.fn(async () => 301);
    const counter = createCrudUnfilteredTotalCounter(loadCount);

    await counter.refresh({ where: { journallinkstatus: 'not_fully_linked' } });

    expect(loadCount).toHaveBeenCalledWith({});
    expect(counter.totalItems()).toBe(301);
  });

  it('ignores stale count responses from earlier filters', async () => {
    let resolveFirstCount!: (count: number) => void;
    const firstCount = new Promise<number>((resolve) => {
      resolveFirstCount = resolve;
    });
    const loadCount = vi.fn().mockReturnValueOnce(firstCount).mockResolvedValueOnce(301);
    const counter = createCrudUnfilteredTotalCounter(loadCount);

    const firstRefresh = counter.refresh({ where: { customerid: 'customer-1' } });
    const secondRefresh = counter.refresh({ where: { journallinkstatus: 'not_fully_linked' } });

    await secondRefresh;
    expect(counter.totalItems()).toBe(301);

    resolveFirstCount(74);
    await firstRefresh;
    expect(counter.totalItems()).toBe(301);
  });
});
