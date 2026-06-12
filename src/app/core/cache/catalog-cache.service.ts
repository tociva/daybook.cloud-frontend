import { Injectable, inject } from '@angular/core';
import { UserSessionStore } from '../../components/features/management/data/user-session/user-session.store';

const DB_NAME = 'daybook-catalog-cache';
const DB_VERSION = 1;
const STORE_NAME = 'catalogs';

export type CatalogCacheScope = Readonly<{
  branchId: string;
  fiscalYearId: string;
  organizationId: string;
  userId: string;
}>;

type CatalogCacheRecord<TEntity> = Readonly<{
  cacheName: string;
  catalog: readonly TEntity[];
  id: string;
  scope: CatalogCacheScope;
  updatedAt: string;
}>;

@Injectable({ providedIn: 'root' })
export class CatalogCacheService {
  private readonly userSessionStore = inject(UserSessionStore);
  private dbPromise: Promise<IDBDatabase | null> | null = null;

  currentScope(): CatalogCacheScope | null {
    const session = this.userSessionStore.session();
    const userId = session?.userid ?? null;
    const organizationId = session?.organization?.id ?? null;
    const branchId = session?.branch?.id ?? null;
    const fiscalYearId = session?.fiscalyear?.id ?? null;

    if (!userId || !organizationId || !branchId || !fiscalYearId) return null;

    return { branchId, fiscalYearId, organizationId, userId };
  }

  async loadCatalog<TEntity>(cacheName: string): Promise<readonly TEntity[] | null> {
    const scope = this.currentScope();
    if (!scope) return null;

    const db = await this.openDb();
    if (!db) return null;

    const record = await this.getRecord<TEntity>(db, this.recordId(cacheName, scope));
    return record?.catalog ?? null;
  }

  async persistCatalog<TEntity>(cacheName: string, catalog: readonly TEntity[]): Promise<void> {
    const scope = this.currentScope();
    if (!scope) return;

    const db = await this.openDb();
    if (!db) return;

    await this.writeRecord(db, {
      cacheName,
      catalog,
      id: this.recordId(cacheName, scope),
      scope,
      updatedAt: new Date().toISOString(),
    });
  }

  async clearCatalog(cacheName: string): Promise<void> {
    const scope = this.currentScope();
    if (!scope) return;

    const db = await this.openDb();
    if (!db) return;

    await this.deleteRecord(db, this.recordId(cacheName, scope));
  }

  async clearCurrentScope(): Promise<void> {
    const scope = this.currentScope();
    if (!scope) return;
    await this.clearMatching((record) => this.sameScope(record.scope, scope));
  }

  async clearScope(scope: CatalogCacheScope): Promise<void> {
    await this.clearMatching((record) => this.sameScope(record.scope, scope));
  }

  async clearUser(userId: string): Promise<void> {
    await this.clearMatching((record) => record.scope.userId === userId);
  }

  private async clearMatching(
    matches: (record: CatalogCacheRecord<unknown>) => boolean,
  ): Promise<void> {
    const db = await this.openDb();
    if (!db) return;

    const records = await this.getAllRecords(db);
    await Promise.all(records.filter(matches).map((record) => this.deleteRecord(db, record.id)));
  }

  private sameScope(left: CatalogCacheScope, right: CatalogCacheScope): boolean {
    return (
      left.userId === right.userId &&
      left.organizationId === right.organizationId &&
      left.branchId === right.branchId &&
      left.fiscalYearId === right.fiscalYearId
    );
  }

  private recordId(cacheName: string, scope: CatalogCacheScope): string {
    return [scope.userId, scope.organizationId, scope.branchId, scope.fiscalYearId, cacheName].join(
      ':',
    );
  }

  private async openDb(): Promise<IDBDatabase | null> {
    if (typeof indexedDB === 'undefined') return null;

    if (!this.dbPromise) {
      this.dbPromise = new Promise<IDBDatabase | null>((resolve) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        };

        request.onerror = () => resolve(null);
        request.onsuccess = () => resolve(request.result);
      });
    }

    return this.dbPromise;
  }

  private getRecord<TEntity>(
    db: IDBDatabase,
    id: string,
  ): Promise<CatalogCacheRecord<TEntity> | null> {
    return new Promise((resolve) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id);
      request.onerror = () => resolve(null);
      request.onsuccess = () => resolve((request.result as CatalogCacheRecord<TEntity>) ?? null);
    });
  }

  private getAllRecords(db: IDBDatabase): Promise<CatalogCacheRecord<unknown>[]> {
    return new Promise((resolve) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
      request.onerror = () => resolve([]);
      request.onsuccess = () => resolve((request.result as CatalogCacheRecord<unknown>[]) ?? []);
    });
  }

  private writeRecord<TEntity>(
    db: IDBDatabase,
    record: CatalogCacheRecord<TEntity>,
  ): Promise<void> {
    return new Promise((resolve) => {
      const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(record);
      request.onerror = () => resolve();
      request.onsuccess = () => resolve();
    });
  }

  private deleteRecord(db: IDBDatabase, id: string): Promise<void> {
    return new Promise((resolve) => {
      const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(id);
      request.onerror = () => resolve();
      request.onsuccess = () => resolve();
    });
  }
}
