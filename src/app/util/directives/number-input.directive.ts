import { Directive, ElementRef, Renderer2 } from '@angular/core';
import { TextInputDirective } from './text-input.directive';

@Directive({
  selector: '[appNumberInput]',
})
export class NumberInputDirective extends TextInputDirective {
  constructor(el: ElementRef, renderer: Renderer2) {
    super(el, renderer);
    renderer.setStyle(el.nativeElement, 'text-align', 'right');
    renderer.setStyle(el.nativeElement, 'padding-right', '1px');
  }
}
