import { Component, computed, input, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-item-landing-paginator',
  imports: [NgIcon],
  templateUrl: './item-landing-paginator.html',
  styleUrl: './item-landing-paginator.css'
})
export class ItemLandingPaginator<T> {

  readonly currentPage = input<number>(1);
  readonly pageSize = input<number>(10);
  readonly totalItems = input<number>(0); // This should be updated when data loads

// Computed values
getTotalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));

getShowingFrom = computed(() => {
  const from = (this.currentPage() - 1) * this.pageSize() + 1;
  return this.totalItems() === 0 ? 0 : from;
});

getShowingTo = computed(() => {
  const to = Math.min(this.currentPage() * this.pageSize(), this.totalItems());
  return to;
});

// Get paginated items (if you're doing client-side pagination)
paginatedItems = computed(() => {
  
});

// Pagination methods
goToPage(page: number): void {
  
}

onPageSizeChange(event: Event): void {
  
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

// Update your data loading method to handle pagination
loadData(): void {
  // Your existing loading logic here
  // Make sure to update totalItems() when data is loaded
  
  // Example for server-side pagination:
  // const params = {
  //   page: this.currentPage(),
  //   pageSize: this.pageSize(),
  //   // other filters...
  // };
  // 
  // this.dataService.loadData(params).subscribe(response => {
  //   this.items.set(response.items);
  //   this.totalItems.set(response.totalCount);
  // });
  
  // Example for client-side pagination:
  // this.dataService.loadAllData().subscribe(response => {
  //   this.items.set(response.items);
  //   this.totalItems.set(response.items.length);
  // });
}

// If you want to use the paginated items in your template instead of all items,
// replace items() with paginatedItems() in your table *ngFor
}
