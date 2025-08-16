import { Component, computed, input, signal, output, inject } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-item-landing-paginator',
  imports: [NgIcon],
  templateUrl: './item-landing-paginator.html',
  styleUrl: './item-landing-paginator.css'
})
export class ItemLandingPaginator<T> {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly currentPage = input<number>(1);
  readonly pageSize = input<number>(10);
  readonly count = input<number>(0);
  readonly items = input<T[]>([]);

  // Events
  readonly pageChanged = output<{ page: number; pageSize: number; offset: number; limit: number }>();

  // Computed values
  getTotalPages = computed(() => Math.ceil(this.count() / this.pageSize()));

  getShowingFrom = computed(() => {
    const from = (this.currentPage() - 1) * this.pageSize() + 1;
    return this.count() === 0 ? 0 : from;
  });

  getShowingTo = computed(() => {
    const to = Math.min(this.currentPage() * this.pageSize(), this.count());
    return to;
  });

  // Get paginated items (for client-side pagination)
  paginatedItems = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.items().slice(start, end);
  });

  // Get current offset for server-side pagination
  getCurrentOffset = computed(() => (this.currentPage() - 1) * this.pageSize());

  // Pagination methods
  goToPage(page: number): void {
    if (page < 1 || page > this.getTotalPages() || page === this.currentPage()) {
      return;
    }

    this.updateUrlParams(page, this.pageSize());
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newPageSize = parseInt(target.value, 10);
    
    // Calculate what page we should be on to show similar items
    const currentFirstItem = (this.currentPage() - 1) * this.pageSize() + 1;
    const newPage = Math.ceil(currentFirstItem / newPageSize);
    
    this.updateUrlParams(newPage, newPageSize);
  }

  // Navigation methods
  goToFirstPage(): void {
    this.goToPage(1);
  }

  goToPreviousPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  goToNextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }

  goToLastPage(): void {
    this.goToPage(this.getTotalPages());
  }

  // Helper methods for template
  isFirstPage(): boolean {
    return this.currentPage() === 1;
  }

  isLastPage(): boolean {
    return this.currentPage() === this.getTotalPages();
  }

  private updateUrlParams(page: number, pageSize: number): void {
    const offset = (page - 1) * pageSize;
    const limit = pageSize;

    // Update URL query parameters
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        ...this.route.snapshot.queryParams, // Preserve other query params
        page: page,
        limit: limit,
        offset: offset
      },
      queryParamsHandling: 'merge'
    });

    // Emit the page change event
    this.pageChanged.emit({
      page: page,
      pageSize: pageSize,
      offset: offset,
      limit: limit
    });
  }

  getPageNumbers(): (number | string)[] {
    const totalPages = this.getTotalPages();
    const current = this.currentPage();
    const pages: (number | string)[] = [];
    
    if (totalPages <= 7) {
      // Show all pages if total pages <= 7
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      if (current > 3) {
        pages.push(1);
        if (current > 4) pages.push('...');
      }
      
      // Show pages around current page
      for (let i = Math.max(1, current - 2); i <= Math.min(totalPages, current + 2); i++) {
        pages.push(i);
      }
      
      // Always show last page
      if (current < totalPages - 2) {
        if (current < totalPages - 3) pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  }

}