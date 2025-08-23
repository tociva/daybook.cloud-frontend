import { LB4Search } from "./query-params-util";

export interface Count {
  count: number;
}

// LoopBack Query Builder Utility
export interface LB4Filter {
  offset?: number;
  limit?: number;
  order?: string;
  where?: Record<string, any>;
  fields?: Record<string, boolean>;
  include?: Array<{
    relation: string;
    scope?: LB4Filter;
  } | string>;
}

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
        [field]: { ilike: `%${query}%` }
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
    
    const dateCondition: any = {};
    if (from) dateCondition.gte = from.toISOString();
    if (to) dateCondition.lte = to.toISOString();
    
    if (Object.keys(dateCondition).length > 0) {
      this.filter.where[field] = dateCondition;
    }
    return this;
  }

  // Include relations
  include(relation: string, scope?: LB4Filter): this {
    if (!this.filter.include) this.filter.include = [];
    
    if (scope) {
      this.filter.include.push({ relation, scope });
    } else {
      this.filter.include.push(relation);
    }
    return this;
  }

  // Apply filters from signal store
  applySignalStoreFilters(
    limit: number,
    offset: number,
    search: LB4Search,
    sort: [string, string][],
    includes?: string[]
  ): this {
    // Pagination
    this.offset(offset).limit(limit);

    // Search
    if (search) {
      this.search(search.query, search.fields);
    }

    // Sort
    if (sort && sort.length > 0) {
      // Assuming sort format is "field ASC" or "field DESC"
      this.filter.order = sort.map(sort => `${sort[0]} ${sort[1]}`).join(',');
    }

    // Includes
    if (includes && includes.length > 0) {
      includes.forEach(include => this.include(include));
    }

    return this;
  }

  applySignalStoreIncludes(includes?: string[]): this {
    if (includes && includes.length > 0) {
      includes.forEach(include => this.include(include));
    }
    return this;
  }

  // Build the final filter object
  build(): LB4Filter {
    return { ...this.filter };
  }

  // Convert to query parameters for LoopBack 4 (filter as object)
  toQueryParams(): Record<string, any> {
    return {
      filter: this.filter
    };
  }

  // Convert to query parameters with JSON string (for older APIs)
  toQueryParamsAsString(): Record<string, string> {
    return {
      filter: JSON.stringify(this.filter)
    };
  }
}