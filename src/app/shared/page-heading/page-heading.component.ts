import { Component, input } from '@angular/core';
import { TngSeparatorComponent } from '@tailng-ui/components';

@Component({
  selector: 'app-page-heading',
  imports: [TngSeparatorComponent],
  templateUrl: './page-heading.component.html',
  styleUrl: './page-heading.component.css',
})
export class PageHeadingComponent {
  readonly eyebrow = input('');
  readonly title = input.required<string>();
  readonly description = input('');
}
