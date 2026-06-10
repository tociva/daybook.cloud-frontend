import { Injectable, inject, signal } from '@angular/core';
import { LedgerService } from '../../../../data/ledger/ledger.service';
import type { Ledger } from '../../../../data/ledger';
import { LedgerStore } from '../../../../data/ledger';

@Injectable()
export class JournalAssignLedgerNamesService {
  private readonly ledgerService = inject(LedgerService);
  private readonly ledgerStore = inject(LedgerStore);
  private readonly ledgerNames = signal(new Map<string, string>());
  private fetchVersion = 0;

  getLedgerName(ledgerid: string): string {
    return this.ledgerNames().get(ledgerid) ?? ledgerid;
  }

  reset(): void {
    this.fetchVersion++;
    this.ledgerNames.set(new Map());
  }

  async fetchLedgerNames(ids: readonly string[]): Promise<void> {
    const fetchVersion = ++this.fetchVersion;
    const cachedNames = this.resolveCachedLedgerNames(ids);
    this.mergeLedgerNames(cachedNames);

    const missingIds = ids.filter((id) => !cachedNames.has(id));
    if (!missingIds.length) return;

    try {
      const ledgers = await this.ledgerService.list({
        where: { id: { inq: missingIds } },
        limit: missingIds.length,
      });
      if (fetchVersion !== this.fetchVersion) return;
      this.mergeLedgerNames(this.toLedgerNameMap(ledgers));
    } catch {
      // Non-critical: IDs shown as fallback
    }
  }

  private resolveCachedLedgerNames(ids: readonly string[]): ReadonlyMap<string, string> {
    const requestedIds = new Set(ids);
    const cachedNames = new Map<string, string>();

    for (const [id, name] of this.ledgerNames()) {
      if (requestedIds.has(id)) cachedNames.set(id, name);
    }

    const ledgerState = this.ledgerStore.ledger();
    this.addLedgerNames(cachedNames, requestedIds, ledgerState.catalog);
    this.addLedgerNames(cachedNames, requestedIds, ledgerState.items);

    const selectedLedger = ledgerState.selectedItem;
    if (selectedLedger) {
      this.addLedgerNames(cachedNames, requestedIds, [selectedLedger]);
    }

    return cachedNames;
  }

  private addLedgerNames(
    target: Map<string, string>,
    requestedIds: ReadonlySet<string>,
    ledgers: readonly Ledger[],
  ): void {
    for (const ledger of ledgers) {
      if (ledger.id && requestedIds.has(ledger.id)) {
        target.set(ledger.id, ledger.name ?? ledger.id);
      }
    }
  }

  private mergeLedgerNames(names: ReadonlyMap<string, string>): void {
    if (!names.size) return;

    this.ledgerNames.update((current) => {
      const next = new Map(current);
      for (const [id, name] of names) {
        next.set(id, name);
      }
      return next;
    });
  }

  private toLedgerNameMap(ledgers: readonly Ledger[]): ReadonlyMap<string, string> {
    return new Map(
      ledgers.flatMap((ledger) => (ledger.id ? [[ledger.id, ledger.name ?? ledger.id]] : [])),
    );
  }
}
