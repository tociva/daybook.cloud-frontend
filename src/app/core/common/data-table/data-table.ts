import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { DataTableColumnDefinition } from './data-table-column-defenition';

@Component({
  selector: 'app-data-table',
  imports: [CommonModule],
  templateUrl: './data-table.html',
  styleUrl: './data-table.scss'
})
export class DataTable<T> {

  @Input() data: T[] = [];
  @Input() columns: DataTableColumnDefinition<T>[] = [];

  getCellValue(row: any, field: string): unknown {
    return field.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), row);
  }
  
}
