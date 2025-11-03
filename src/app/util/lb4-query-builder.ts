import { LB4Search } from "./query-params-util";

export interface Count {
  count: number;
}

// ---- Types -------------------------------------------------------
type AnyObject = Record<string, unknown>;

export interface LB4Filter {
  offset?: number;
  limit?: number;
  order?: string;
  where?: Record<string, any>;
  fields?: Record<string, boolean>;
  include?: IncludeSpec[];
}

export type IncludeSpec =
  | string
  | {
      relation: string;
      scope?: LB4Filter;
    };

// ---- Builder -----------------------------------------------------
export class LB4QueryBuilder {
  private filter: LB4Filter = {};

  static create(): LB4QueryBuilder {
    return new LB4QueryBuilder();
  }

  // Pagination
  offset(value: number): this {
    this.filter.offset = value;
    return this;
  }

  limit(value: number): this {
    this.filter.limit = value;
    return this;
  }

  // Sorting
  order(field: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.filter.order = `${field} ${direction}`;
    return this;
  }

  // Fields selection
  fields(fieldMap: Record<string, boolean>): this {
    this.filter.fields = { ...this.filter.fields, ...fieldMap };
    return this;
  }

  // Where conditions
  where(conditions: Record<string, any>): this {
    this.filter.where = { ...this.filter.where, ...conditions };
    return this;
  }

  // Search functionality
  search(query: string, fields: string[]): this {
    if (query && query.trim()) {
      const searchConditions = fields.map(field => ({
        [field]: { ilike: `%${query}%` } // keep your existing ilike behavior
      }));

      this.filter.where = {
        ...this.filter.where,
        or: searchConditions
      };
    }
    return this;
  }

  // Equal condition
  equal(field: string, value: any): this {
    if (!this.filter.where) this.filter.where = {};
    this.filter.where[field] = value;
    return this;
  }

  // In condition
  in(field: string, values: any[]): this {
    if (!this.filter.where) this.filter.where = {};
    this.filter.where[field] = { inq: values };
    return this;
  }

  // Like condition
  like(field: string, pattern: string, caseSensitive = false): this {
    if (!this.filter.where) this.filter.where = {};
    this.filter.where[field] = {
      like: pattern,
      options: caseSensitive ? '' : 'i'
    };
    return this;
  }

  // Date range
  dateRange(field: string, from?: Date, to?: Date): this {
    if (!this.filter.where) this.filter.where = {};

    const dateCondition: AnyObject = {};
    if (from) dateCondition['gte'] = from.toISOString();
    if (to) dateCondition['lte'] = to.toISOString();

    if (Object.keys(dateCondition).length > 0) {
      this.filter.where[field] = dateCondition;
    }
    return this;
  }

  // Include relations (backward compatible)
  include(relation: string, scope?: LB4Filter): this {
    if (!this.filter.include) this.filter.include = [];
    if (scope) {
      this.filter.include.push({ relation, scope });
    } else {
      this.filter.include.push(relation);
    }
    return this;
  }

  // ====== MERGING INCLUDE IMPLEMENTATION STARTS HERE ======

  // Build/merge include tree from dot-paths (e.g., "items.taxes.tax")
  private includePath(path: string): this {
    const parts = path.split('.').filter(Boolean);
    if (parts.length === 0) return this;

    this.filter.include ??= [];

    // Walk/merge from root down
    let cursor = this._getOrCreateNode(this.filter.include, parts[0]);

    for (let i = 1; i < parts.length; i++) {
      const scope = this._ensureScope(cursor);
      scope.include ??= [];
      cursor = this._getOrCreateNode(scope.include, parts[i]);
    }

    return this;
  }

  // Normalize and merge includes (string, dot-path, or object spec)
  private pushInclude(i: IncludeSpec): void {
    this.filter.include ??= [];

    if (typeof i === 'string') {
      if (i.includes('.')) {
        this.includePath(i);
      } else {
        // simple relation: ensure a single node exists
        this._getOrCreateNode(this.filter.include, i);
      }
      return;
    }

    // object spec: merge into existing tree
    const tmpRoot: IncludeSpec[] = [{ ...i }];
    this._mergeIncludeArrays(this.filter.include, tmpRoot);
  }

  // --- Helpers to merge include trees -------------------------------
  private _ensureScope(node: Exclude<IncludeSpec, string>): LB4Filter {
    node.scope ??= {};
    node.scope.include ??= [];
    return node.scope;
  }

  private _findNode(includes: IncludeSpec[] | undefined, relation: string): Exclude<IncludeSpec, string> | undefined {
    if (!includes) return undefined;
    for (let i = 0; i < includes.length; i++) {
      const cur = includes[i];
      if (typeof cur === 'string') {
        if (cur === relation) {
          // Upgrade string to object node so we can attach children
          const obj = { relation } as Exclude<IncludeSpec, string>;
          includes[i] = obj;
          return obj;
        }
      } else if (cur.relation === relation) {
        return cur;
      }
    }
    return undefined;
  }

  private _getOrCreateNode(includes: IncludeSpec[], relation: string): Exclude<IncludeSpec, string> {
    const found = this._findNode(includes, relation);
    if (found) return found;
    const created = { relation } as Exclude<IncludeSpec, string>;
    includes.push(created);
    return created;
  }

  private _mergeIncludeArrays(target: IncludeSpec[], source: IncludeSpec[]) {
    for (const s of source) {
      if (typeof s === 'string') {
        // ensure we have/upgrade to an object node
        this._getOrCreateNode(target, s);
        continue;
      }
      // object: merge by relation
      const t = this._getOrCreateNode(target, s.relation);

      if (s.scope) {
        t.scope ??= {};

        // merge non-include scope keys (where/fields/order/limit/offset, etc.)
        for (const [k, v] of Object.entries(s.scope)) {
          if (k === 'include') continue;
          (t.scope as AnyObject)[k] = v as any; // last-writer-wins
        }

        // merge nested includes recursively
        if (s.scope.include && s.scope.include.length) {
          t.scope.include ??= [];
          this._mergeIncludeArrays(t.scope.include, s.scope.include);
        }
      }
    }
  }

  // ====== MERGING INCLUDE IMPLEMENTATION ENDS HERE ======

  // Apply filters from signal store
  applySignalStoreFilters(
    limit: number,
    offset: number,
    search: LB4Search[],
    sort: [string, string][],
    includes?: Array<string | IncludeSpec>
  ): this {
    // Pagination
    this.offset(offset).limit(limit);

    // Search
    if (search?.length) {
      search.forEach(s => this.search(s.query, s.fields));
    }

    // Sort (allow multi-field order)
    if (sort && sort.length > 0) {
      this.filter.order = sort.map(([f, d]) => `${f} ${d}`).join(',');
    }

    // Includes
    if (includes && includes.length > 0) {
      includes.forEach(i => this.pushInclude(i));
    }

    return this;
  }

  // Apply includes only
  applySignalStoreIncludes(includes?: Array<string | IncludeSpec>): this {
    if (includes && includes.length > 0) {
      includes.forEach(i => this.pushInclude(i));
    }
    return this;
  }

  // Build the final filter object
  build(): LB4Filter {
    return { ...this.filter };
    // Optionally deep-clone if you plan to mutate later.
  }

  // Convert to query parameters for LoopBack 4 (filter as object)
  toQueryParams(): Record<string, any> {
    return { filter: this.filter };
  }

  // Convert to query parameters with JSON string (for older APIs)
  toQueryParamsAsString(): Record<string, string> {
    return { filter: JSON.stringify(this.filter) };
  }
}
