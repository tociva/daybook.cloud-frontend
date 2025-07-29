import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  standalone: true,
  selector: 'app-paginator',
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatMenuModule, MatFormFieldModule],
  templateUrl: './paginator.html',
  styleUrl: './paginator.scss',
})
export class Paginator {
  @Input() page = 0;
  @Input() limit = 10;
  @Input() totalCount = 0;
  @Input() pageSizeOptions: number[] = [10, 25, 50];

  @Output() pageChange = new EventEmitter<{ page: number; limit: number }>();

  get pageStart(): number {
    return this.page * this.limit;
  }

  get pageEnd(): number {
    return Math.min(this.pageStart + this.limit, this.totalCount);
  }

  changePage(newPage: number) {
    const maxPage = Math.floor((this.totalCount - 1) / this.limit);
    if (newPage >= 0 && newPage <= maxPage) {
      this.pageChange.emit({ page: newPage, limit: this.limit });
    }
  }

  onLimitChange() {
    this.changePage(0);
  }

  get lastPage(): number {
    return Math.max(Math.ceil(this.totalCount / this.limit) - 1, 0);
  }

  onLimitSelect(size: number) {
    this.limit = size;
    this.onLimitChange(); // or emit output if reusable component
  }
  
}
