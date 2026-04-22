import { Directive, ElementRef, AfterViewInit, Input } from '@angular/core';

@Directive({
  selector: '[appAutoFocus]'
})
export class AutoFocusDirective implements AfterViewInit {
  @Input('appAutoFocus') enabled: boolean | string = true;

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    if (this.enabled !== false && this.enabled !== 'false') {
      setTimeout(() => {
        const element = this.el.nativeElement;
        if (element) {
          element.focus();
          
          // If it's an input, select the text for faster editing
          if (element instanceof HTMLInputElement) {
            element.select();
          }
        }
      }, 300); // Small delay to allow modal animations to settle
    }
  }
}
