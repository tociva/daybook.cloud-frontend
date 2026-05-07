import { Directive } from '@angular/core';

@Directive({
  selector: '[tngTagIcon]',
  host: {
    'data-slot': 'tag-icon',
  },
})
export class TngTagIcon {}
