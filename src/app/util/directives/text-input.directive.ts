import { Directive, ElementRef, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appTextInput]',
})
export class TextInputDirective {
  constructor(el: ElementRef, renderer: Renderer2) {
    renderer.addClass(el.nativeElement, 'flex-1');
    renderer.addClass(el.nativeElement, 'border-0');
    renderer.addClass(el.nativeElement, 'border-b');
    renderer.addClass(el.nativeElement, 'bg-transparent');
    renderer.addClass(el.nativeElement, 'text-sm');
    renderer.addClass(el.nativeElement, 'leading-tight');
    renderer.addClass(el.nativeElement, 'pt-0.5');
    renderer.addClass(el.nativeElement, 'pb-1');
    renderer.addClass(el.nativeElement, 'px-0');
    renderer.addClass(el.nativeElement, 'focus:outline-none');
    renderer.addClass(el.nativeElement, 'focus:border-b-primary');
    renderer.addClass(el.nativeElement, 'border-b-gray-300');
  }
}
