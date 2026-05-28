import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import type { UserSession } from '../../components/features/management/data/user-session/user-session.model';

const STORAGE_KEY = 'daybook:ledger-cache';

type PersistedLedgerCache = Readonly<{
  enabled: boolean;
}>;

function resolveLedgerCacheEnabled(raw: unknown): boolean {
  if (typeof raw === 'boolean') return raw;
  if (raw === 'false' || raw === 0 || raw === '0') return false;
  return true;
}

function loadPersistedLedgerCache(): PersistedLedgerCache {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { enabled: true };
    const parsed = JSON.parse(raw) as Partial<PersistedLedgerCache>;
    return { enabled: resolveLedgerCacheEnabled(parsed.enabled) };
  } catch {
    return { enabled: true };
  }
}

function persistLedgerCache(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled }));
  } catch {
    // localStorage may be unavailable
  }
}

export const LedgerCachePreferencesStore = signalStore(
  { providedIn: 'root' },
  withState(() => {
    const persisted = loadPersistedLedgerCache();
    return { enabled: persisted.enabled };
  }),
  withMethods((store) => ({
    /** Preview only — does not persist until commit(). */
    setEnabled(enabled: boolean): void {
      patchState(store, { enabled });
    },
    initFromSession(session: UserSession): void {
      const enabled = resolveLedgerCacheEnabled(session.props?.ledgerCache);
      patchState(store, { enabled });
      persistLedgerCache(enabled);
    },
    commit(): void {
      persistLedgerCache(store.enabled());
    },
  })),
);
