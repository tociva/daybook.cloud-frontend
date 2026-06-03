import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TngButtonComponent } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';

export type TableRowIconActionTone = 'neutral' | 'danger';

@Component({
  selector: 'app-table-row-icon-button',
  imports: [TngButtonComponent, TngIcon],
  templateUrl: './table-row-icon-button.component.html',
  styleUrl: './table-row-icon-button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableRowIconButtonComponent {
  readonly icon = input.required<string>();
  readonly ariaLabel = input.required<string>();
  readonly tone = input<TableRowIconActionTone>('neutral');
  readonly disabled = input(false);
  readonly action = output<void>();

  protected onAction(): void {
    if (this.disabled()) {
      return;
    }

    this.action.emit();
  }
}
